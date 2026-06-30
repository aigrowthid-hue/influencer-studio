import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';
import { buildScenePrompt } from '@/lib/prompt-builders/scene-builder';
import { getImageProvider } from '@/lib/providers';
import { extractCharacterPortrait } from '@/lib/image/character-portrait';

const COST_PER_SCENE_IMAGE = 5;

export async function POST(req: NextRequest) {
  const userId = req.cookies.get('userId')?.value || 'usr_default';
  const generationIds: string[] = [];
  let totalCost = 0;

  try {
    const body = await req.json();
    const {
      characterId,
      selectedInfluencerId,
      sceneDescription,
      userSceneDescription,
      aspectRatio = '1:1',
      outputCount = 1,

      // Identity
      identityLock,
      characterSheetReferenceImage,

      // Reference uploads (base64 data URLs are accepted by Fal endpoints)
      locationRefUrl,
      backgroundReferenceImage,
      outfitRefUrl,
      outfitReferenceImage,
      poseRefUrl,
      poseReferenceImage,
      propRefUrl,
      productReferenceImage,
    } = body;

    const finalCharacterId = selectedInfluencerId || characterId;
    const finalSceneDescription = (userSceneDescription || sceneDescription || '').trim();
    const finalLocationRefUrl = backgroundReferenceImage || locationRefUrl || null;
    const finalOutfitRefUrl = outfitReferenceImage || outfitRefUrl || null;
    const finalPoseRefUrl = poseReferenceImage || poseRefUrl || null;
    const finalPropRefUrl = productReferenceImage || propRefUrl || null;

    if (!finalCharacterId || !finalSceneDescription) {
      return NextResponse.json({ error: 'characterId and sceneDescription are required' }, { status: 400 });
    }

    const character = await db.getCharacter(finalCharacterId);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const characterSheetUrl = characterSheetReferenceImage || character.characterSheetUrl;
    if (!characterSheetUrl) {
      return NextResponse.json({
        error: 'Character sheet not found. Please generate the character sheet first in Character Studio.'
      }, { status: 400 });
    }

    totalCost = COST_PER_SCENE_IMAGE * Math.max(1, outputCount);

    const hasCredits = await CreditService.hasSufficientCredits(userId, totalCost);
    if (!hasCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Needs ${totalCost} credits to generate ${outputCount} image(s).`
      }, { status: 402 });
    }

    // Always rebuild the prompt server-side from the canonical character profile.
    // The client-side preview prompt is for display only.
    const { finalPrompt, negativePrompt, promptBreakdown } = buildScenePrompt({
      characterProfile: character.profileJson,
      characterName: character.name,
      sceneDescription: finalSceneDescription,
      identityLock,
      hasCharacterSheet: !!characterSheetUrl,
      hasLocationRef: !!finalLocationRefUrl,
      hasOutfitRef: !!finalOutfitRefUrl,
      hasPoseRef: !!finalPoseRefUrl,
      hasProductRef: !!finalPropRefUrl
    });

    await CreditService.deductCredits(
      userId,
      totalCost,
      null,
      `Compose scene with character "${character.name}" (${outputCount} image(s))`
    );

    const generations = [];
    for (let i = 0; i < outputCount; i++) {
      const genId = `gen_${Math.random().toString(36).substring(2, 11)}`;
      generationIds.push(genId);

      const gen = await db.createGeneration({
        id: genId,
        userId,
        projectId: character.projectId,
        characterId: finalCharacterId,
        type: 'scene_image',
        provider: 'Pending',
        model: 'Pending',
        prompt: finalPrompt,
        negativePrompt,
        inputAssetsJson: {
          characterSheetUrl,
          locationRefUrl: finalLocationRefUrl,
          outfitRefUrl: finalOutfitRefUrl,
          poseRefUrl: finalPoseRefUrl,
          propRefUrl: finalPropRefUrl,
          promptBreakdown,
          sceneDescription: finalSceneDescription
        },
        outputUrl: null,
        outputThumbnailUrl: null,
        status: 'processing',
        errorMessage: null,
        creditsUsed: COST_PER_SCENE_IMAGE
      });
      generations.push(gen);
    }

    // The character sheet is a 9-panel grid which confuses multi-reference image models
    // (they read it as 9 different people). Extract the close-up front portrait so the
    // model gets a clean single-face reference for identity lock.
    let identityRefUrl = characterSheetUrl;
    try {
      identityRefUrl = await extractCharacterPortrait(characterSheetUrl);
    } catch (cropErr) {
      console.warn('Character portrait extraction failed, falling back to full sheet:', cropErr);
    }

    const imageProvider = await getImageProvider();
    const result = await imageProvider.generateImage({
      prompt: finalPrompt,
      negativePrompt,
      aspectRatio,
      outputCount,
      characterProfile: character.profileJson,
      characterSheetUrl: identityRefUrl,
      locationRefUrl: finalLocationRefUrl || undefined,
      outfitRefUrl: finalOutfitRefUrl || undefined,
      poseRefUrl: finalPoseRefUrl || undefined,
      propRefUrl: finalPropRefUrl || undefined,
      workflow: 'scene'
    });

    if (!result.success || result.outputUrls.length === 0) {
      throw new Error(result.errorMessage || 'Image provider failed');
    }

    const completedGenerations = [];
    for (let i = 0; i < generations.length; i++) {
      const outputUrl = result.outputUrls[i] || result.outputUrls[0];
      const updated = await db.updateGeneration(generations[i].id, {
        status: 'completed',
        outputUrl,
        outputThumbnailUrl: outputUrl,
        provider: result.provider,
        model: result.model
      });
      completedGenerations.push(updated);
    }

    return NextResponse.json({ generations: completedGenerations });

  } catch (error: any) {
    console.error('Scene generation error:', error);

    if (totalCost > 0) {
      try {
        await CreditService.refundCredits(
          userId,
          totalCost,
          null,
          `Refund: Failed scene image generation`
        );
      } catch (refundErr) {
        console.error('Failed to refund credits:', refundErr);
      }
    }

    for (const genId of generationIds) {
      await db.updateGeneration(genId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown generation failure'
      }).catch(console.error);
    }

    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
