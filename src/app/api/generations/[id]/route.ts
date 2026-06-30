import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { getVideoProvider } from '@/lib/providers';
import { CreditService } from '@/lib/credits/credit-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const generation = await db.getGeneration(id);
    
    if (!generation) {
      return NextResponse.json({ error: 'Generation record not found' }, { status: 404 });
    }

    // If it's a video and currently in progress, poll the video provider to update status
    if (generation.type === 'video' && (generation.status === 'queued' || generation.status === 'processing')) {
      const jobId = generation.inputAssetsJson?.jobId;
      
      if (jobId) {
        const videoProvider = await getVideoProvider();
        const statusResult = await videoProvider.getVideoStatus(jobId);

        if (statusResult.status !== generation.status) {
          // Status has changed! Update database
          let outputUrl = statusResult.videoUrl || null;
          let outputThumbnailUrl = statusResult.thumbnailUrl || null;
          let errorMessage = statusResult.errorMessage || null;

          // Update generation record
          const updatedGen = await db.updateGeneration(id, {
            status: statusResult.status,
            outputUrl,
            outputThumbnailUrl,
            errorMessage
          });

          // Find corresponding video record and update it
          const userVideos = await db.listVideos(generation.userId);
          const videoRecord = userVideos.find(
            v => v.sourceImageGenerationId === generation.inputAssetsJson?.sourceImageGenerationId
          );

          if (videoRecord) {
            await db.updateVideo(videoRecord.id, {
              status: statusResult.status,
              videoUrl: outputUrl,
              thumbnailUrl: outputThumbnailUrl
            });
          }

          // Handle refund if generation failed
          if (statusResult.status === 'failed') {
            console.log(`Job ${jobId} failed. Refunding user credits...`);
            await CreditService.refundCredits(
              generation.userId,
              generation.creditsUsed,
              generation.id,
              `Refund: Failed video animation job`
            );
          }

          return NextResponse.json({ generation: updatedGen });
        }
      }
    }

    return NextResponse.json({ generation });

  } catch (error: any) {
    console.error('Check generation status error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
