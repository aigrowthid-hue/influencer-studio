import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';
import { buildScenePrompt } from '@/lib/prompt-builders/scene-builder';
import { getImageProvider } from '@/lib/providers';

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
      // Reference upload URLs (optional)
      locationRefUrl,
      backgroundReferenceImage,
      outfitRefUrl,
      outfitReferenceImage,
      poseRefUrl,
      poseReferenceImage,
      propRefUrl,
      productReferenceImage,
      
      // Override prompts
      finalComposedPrompt,
      negativePrompt: negativePromptOverride,

      // Control toggles
      location,
      timeOfDay,
      weather,
      cameraAngle,
      shotType,
      lensStyle,
      lighting,
      pose,
      expression,
      action,
      outfitInstruction,
      props,
      productPlacement,
      realismLevel,
      contentType,
      useAdvanced
    } = body;

    const finalCharacterId = selectedInfluencerId || characterId;
    const finalSceneDescription = userSceneDescription || sceneDescription;
    const finalLocationRefUrl = backgroundReferenceImage || locationRefUrl;
    const finalOutfitRefUrl = outfitReferenceImage || outfitRefUrl;
    const finalPoseRefUrl = poseReferenceImage || poseRefUrl;
    const finalPropRefUrl = productReferenceImage || propRefUrl;

    if (!finalCharacterId || !finalSceneDescription) {
      return NextResponse.json({ error: 'characterId and sceneDescription are required' }, { status: 400 });
    }

    const character = await db.getCharacter(finalCharacterId);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Calculate credits cost
    totalCost = COST_PER_SCENE_IMAGE * Math.max(1, outputCount);

    // 1. Check if user has enough credits
    const hasCredits = await CreditService.hasSufficientCredits(userId, totalCost);
    if (!hasCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Needs ${totalCost} credits to generate ${outputCount} image(s).`
      }, { status: 402 });
    }

    // 2. Build composed prompt
    const { finalPrompt: builtPrompt, negativePrompt: builtNegativePrompt, promptBreakdown } = buildScenePrompt({
      characterProfile: character.profileJson,
      characterName: character.name,
      sceneDescription: finalSceneDescription,
      useAdvanced,
      location,
      timeOfDay,
      weather,
      cameraAngle,
      shotType,
      lensStyle,
      lighting,
      pose,
      expression,
      action,
      outfitInstruction,
      props,
      productPlacement,
      realismLevel,
      contentType,
      hasLocationRef: !!finalLocationRefUrl,
      hasOutfitRef: !!finalOutfitRefUrl,
      hasPoseRef: !!finalPoseRefUrl,
      hasProductRef: !!finalPropRefUrl
    });

    const finalPrompt = finalComposedPrompt || builtPrompt;
    const negativePrompt = negativePromptOverride || builtNegativePrompt;

    // 3. Deduct credits
    await CreditService.deductCredits(
      userId,
      totalCost,
      null, // Link inside generation records instead
      `Compose scene with character "${character.name}" (${outputCount} image(s))`
    );

    // Create a base generation record for each requested output image
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
          locationRefUrl: finalLocationRefUrl,
          outfitRefUrl: finalOutfitRefUrl,
          poseRefUrl: finalPoseRefUrl,
          propRefUrl: finalPropRefUrl,
          promptBreakdown,
          options: body
        },
        outputUrl: null,
        outputThumbnailUrl: null,
        status: 'processing',
        errorMessage: null,
        creditsUsed: COST_PER_SCENE_IMAGE
      });
      generations.push(gen);
    }

    // 4. Invoke image generator
    const imageProvider = await getImageProvider();
    const result = await imageProvider.generateImage({
      prompt: finalPrompt,
      negativePrompt,
      aspectRatio,
      outputCount,
      characterProfile: character.profileJson,
      characterSheetUrl: character.characterSheetUrl,
      locationRefUrl: finalLocationRefUrl,
      outfitRefUrl: finalOutfitRefUrl,
      poseRefUrl: finalPoseRefUrl,
      propRefUrl: finalPropRefUrl,
      workflow: 'scene'
    });

    if (!result.success || result.outputUrls.length === 0) {
      throw new Error(result.errorMessage || 'Image provider failed');
    }

    // 5. Update each generation record with its specific generated URL
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

    // Refund credits
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

    // Mark all started jobs as failed
    for (const genId of generationIds) {
      await db.updateGeneration(genId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown generation failure'
      }).catch(console.error);
    }

    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
