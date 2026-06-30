import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';
import { buildCharacterSheetPrompt } from '@/lib/prompt-builders/character-sheet-builder';
import { getImageProvider } from '@/lib/providers';

const COST_CHARACTER_SHEET = 10;

export async function POST(req: NextRequest) {
  const userId = req.cookies.get('userId')?.value || 'usr_default';
  let characterId: string | null = null;
  let generationId = `gen_${Math.random().toString(36).substring(2, 11)}`;

  try {
    const { characterId: id, style = 'realistic' } = await req.json();
    characterId = id;

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
    }

    const character = await db.getCharacter(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // 1. Check if user has enough credits
    const hasCredits = await CreditService.hasSufficientCredits(userId, COST_CHARACTER_SHEET);
    if (!hasCredits) {
      return NextResponse.json({ error: 'Insufficient credits. Needs 10 credits.' }, { status: 402 });
    }

    // 2. Build the structured prompt
    const profileWithName = {
      ...character.profileJson,
      name: character.name
    };
    const { finalPrompt, negativePrompt, promptBreakdown } = buildCharacterSheetPrompt(profileWithName, style);

    // 3. Deduct credits
    await CreditService.deductCredits(
      userId,
      COST_CHARACTER_SHEET,
      generationId,
      `Generate character sheet for "${character.name}"`
    );

    // 4. Create generation record in DB with processing status
    const generation = await db.createGeneration({
      id: generationId,
      userId,
      projectId: character.projectId,
      characterId,
      type: 'character_sheet',
      provider: 'Pending',
      model: 'Pending',
      prompt: finalPrompt,
      negativePrompt,
      inputAssetsJson: { characterId, style, promptBreakdown },
      outputUrl: null,
      outputThumbnailUrl: null,
      status: 'processing',
      errorMessage: null,
      creditsUsed: COST_CHARACTER_SHEET
    });

    // Update character status to processing
    await db.updateCharacter(characterId, { status: 'processing' });

    // 5. Invoke active image provider
    const imageProvider = await getImageProvider();
    const result = await imageProvider.generateImage({
      prompt: finalPrompt,
      negativePrompt,
      aspectRatio: '16:9',
      outputCount: 1,
      characterProfile: character.profileJson,
      workflow: 'character_sheet'
    });

    if (!result.success || result.outputUrls.length === 0) {
      throw new Error(result.errorMessage || 'Image generation provider failed');
    }

    const outputUrl = result.outputUrls[0];

    // 6. Success: Save assets, update character and generation status
    const updatedGen = await db.updateGeneration(generationId, {
      status: 'completed',
      outputUrl,
      outputThumbnailUrl: outputUrl,
      provider: result.provider,
      model: result.model
    });

    await db.updateCharacter(characterId, {
      status: 'completed',
      characterSheetUrl: outputUrl,
      visualDna: `dna_${Math.random().toString(36).substring(2, 9)}` // Simulate visual DNA lock
    });

    // Create character asset record
    await db.createAsset({
      id: `ast_${Math.random().toString(36).substring(2, 11)}`,
      characterId,
      type: 'character_sheet',
      fileUrl: outputUrl,
      metadataJson: { generationId, model: result.model }
    });

    return NextResponse.json({ generation: updatedGen, characterSheetUrl: outputUrl });

  } catch (error: any) {
    console.error('Character sheet generation error:', error);

    // Refund credits on failure
    try {
      await CreditService.refundCredits(
        userId,
        COST_CHARACTER_SHEET,
        generationId,
        `Refund: Failed character sheet generation`
      );
    } catch (refundErr) {
      console.error('Failed to refund credits:', refundErr);
    }

    // Update generation state to failed
    if (generationId) {
      await db.updateGeneration(generationId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown generation failure'
      }).catch(console.error);
    }

    // Update character state to failed
    if (characterId) {
      await db.updateCharacter(characterId, { status: 'failed' }).catch(console.error);
    }

    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
