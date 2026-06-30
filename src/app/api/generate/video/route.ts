import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';
import { buildVideoPrompt } from '@/lib/prompt-builders/video-builder';
import { getVideoProvider } from '@/lib/providers';

const COST_VIDEO_GENERATION = 50; // MVP Standard Cost

export async function POST(req: NextRequest) {
  const userId = req.cookies.get('userId')?.value || 'usr_default';
  let generationId = `gen_${Math.random().toString(36).substring(2, 11)}`;
  let videoId = `vid_${Math.random().toString(36).substring(2, 11)}`;

  try {
    const body = await req.json();
    const {
      sourceImageGenerationId,
      videoType = 'ugc',
      duration = 5,
      aspectRatio = '9:16',
      cameraMovement,
      characterMovement,
      facialExpression,
      gesture,
      dialogue,
      style = 'UGC / smartphone video'
    } = body;

    if (!sourceImageGenerationId) {
      return NextResponse.json({ error: 'sourceImageGenerationId is required' }, { status: 400 });
    }

    // Load source scene image
    const sourceGen = await db.getGeneration(sourceImageGenerationId);
    if (!sourceGen || !sourceGen.outputUrl) {
      return NextResponse.json({ error: 'Source scene image not found or not yet completed' }, { status: 400 });
    }

    // 1. Check if user has enough credits
    const hasCredits = await CreditService.hasSufficientCredits(userId, COST_VIDEO_GENERATION);
    if (!hasCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Needs ${COST_VIDEO_GENERATION} credits to generate video.`
      }, { status: 402 });
    }

    // 2. Build video prompt
    const { finalPrompt, negativePrompt } = buildVideoPrompt({
      videoType,
      duration,
      aspectRatio,
      cameraMovement,
      characterMovement,
      facialExpression,
      gesture,
      dialogue,
      style
    });

    // 3. Deduct credits
    await CreditService.deductCredits(
      userId,
      COST_VIDEO_GENERATION,
      generationId,
      `Animate scene image into video (${duration}s)`
    );

    // 4. Create generation record in DB with queued status
    const generation = await db.createGeneration({
      id: generationId,
      userId,
      projectId: sourceGen.projectId,
      characterId: sourceGen.characterId,
      type: 'video',
      provider: 'Pending',
      model: 'Pending',
      prompt: finalPrompt,
      negativePrompt,
      inputAssetsJson: {
        sourceImageGenerationId,
        videoType,
        duration,
        aspectRatio,
        cameraMovement,
        characterMovement,
        facialExpression,
        gesture,
        dialogue
      },
      outputUrl: null,
      outputThumbnailUrl: null,
      status: 'queued',
      errorMessage: null,
      creditsUsed: COST_VIDEO_GENERATION
    });

    // 5. Create video record in DB
    const videoRecord = await db.createVideo({
      id: videoId,
      userId,
      characterId: sourceGen.characterId,
      sourceImageGenerationId,
      provider: 'Pending',
      model: 'Pending',
      prompt: finalPrompt,
      duration,
      aspectRatio,
      status: 'queued',
      videoUrl: null,
      thumbnailUrl: null,
      creditsUsed: COST_VIDEO_GENERATION
    });

    // 6. Invoke video provider
    const videoProvider = await getVideoProvider();
    const result = await videoProvider.generateVideo({
      sourceImageUrl: sourceGen.outputUrl,
      prompt: finalPrompt,
      duration,
      aspectRatio,
      movement: `${cameraMovement}; ${characterMovement}`,
      dialogue
    });

    if (!result.success || !result.jobId) {
      throw new Error(result.errorMessage || 'Video generation provider failed to queue job');
    }

    // 7. Update records with active provider metadata & Job ID
    const updatedGen = await db.updateGeneration(generationId, {
      provider: result.provider,
      model: result.model,
      inputAssetsJson: {
        ...generation.inputAssetsJson,
        jobId: result.jobId
      }
    });

    await db.updateVideo(videoId, {
      provider: result.provider,
      model: result.model,
      status: 'queued' // Maintain queued status until polled
    });

    // We store the association between generationId and video jobId
    // by appending metadata inside the JSON db or updating as needed.
    // For local ease, we return both.
    return NextResponse.json({
      generation: updatedGen,
      video: videoRecord,
      jobId: result.jobId
    }, { status: 202 });

  } catch (error: any) {
    console.error('Video generation start error:', error);

    // Refund credits
    try {
      await CreditService.refundCredits(
        userId,
        COST_VIDEO_GENERATION,
        generationId,
        `Refund: Failed to start video generation`
      );
    } catch (refundErr) {
      console.error('Failed to refund credits:', refundErr);
    }

    // Mark generation as failed
    if (generationId) {
      await db.updateGeneration(generationId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown generation failure'
      }).catch(console.error);
    }

    // Mark video as failed
    if (videoId) {
      await db.updateVideo(videoId, {
        status: 'failed'
      }).catch(console.error);
    }

    return NextResponse.json({ error: error.message || 'Video generation failed' }, { status: 500 });
  }
}
