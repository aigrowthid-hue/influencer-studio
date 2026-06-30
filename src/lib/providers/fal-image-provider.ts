import { IImageProvider, ImageGenerationInput, ImageGenerationResult } from './image-provider';

type SceneModel = 'nano-banana' | 'ideogram-character' | 'gpt-image';

const FAL_RUN_URL = 'https://fal.run';

function resolveSceneModel(): SceneModel {
  const m = (process.env.FAL_SCENE_MODEL || '').toLowerCase().trim();
  if (m === 'ideogram-character' || m === 'ideogram') return 'ideogram-character';
  if (m === 'gpt-image' || m === 'gpt-image-1' || m === 'gpt-image-2') return 'gpt-image';
  return 'nano-banana';
}

interface FalImageResponse {
  images?: Array<{ url?: string }>;
  detail?: unknown;
  message?: string;
  error?: unknown;
}

export class FalImageProvider implements IImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    try {
      const count = Math.max(1, input.outputCount || 1);

      if (input.workflow === 'character_sheet') {
        return await this.runCharacterSheet(input, count);
      }
      return await this.runScene(input, count);
    } catch (error: any) {
      console.error('Fal.ai image generation error:', error);
      return {
        success: false,
        outputUrls: [],
        errorMessage: error?.message || 'Unknown Fal.ai error',
        provider: 'Fal.ai',
        model: 'unknown'
      };
    }
  }

  // ---------------------------------------------------------------------------
  // CHARACTER SHEET — text-to-image grid. Ideogram v3 handles layout best.
  // ---------------------------------------------------------------------------
  private async runCharacterSheet(input: ImageGenerationInput, count: number): Promise<ImageGenerationResult> {
    const endpoint = 'fal-ai/ideogram/v3';
    const aspectRatio = input.aspectRatio || '16:9';

    const tasks = Array.from({ length: count }, () => {
      const seed = Math.floor(Math.random() * 99999999);
      const payload: Record<string, any> = {
        prompt: `${input.prompt}\n[seed:${seed}]`,
        aspect_ratio: aspectRatio,
        rendering_speed: 'BALANCED',
        style: 'REALISTIC'
      };
      if (input.negativePrompt) payload.negative_prompt = input.negativePrompt;
      return this.callFal(endpoint, payload);
    });

    const urls = await this.collectUrls(tasks, 'Character sheet generation failed');
    return {
      success: true,
      outputUrls: urls,
      provider: 'Fal.ai',
      model: 'ideogram-v3'
    };
  }

  // ---------------------------------------------------------------------------
  // SCENE — compose multiple references. Model selection via FAL_SCENE_MODEL.
  // Order of references (must match scene-builder positions):
  //   1. characterSheet  2. outfit  3. pose  4. location  5. product
  // ---------------------------------------------------------------------------
  private async runScene(input: ImageGenerationInput, count: number): Promise<ImageGenerationResult> {
    const refs: string[] = [
      input.characterSheetUrl,
      input.outfitRefUrl,
      input.poseRefUrl,
      input.locationRefUrl,
      input.propRefUrl
    ].filter((u): u is string => !!u && u.trim().length > 0);

    if (refs.length === 0) {
      return this.runSceneTextOnly(input, count);
    }

    const model = resolveSceneModel();
    if (model === 'ideogram-character') return this.runSceneIdeogram(input, refs, count);
    if (model === 'gpt-image') return this.runSceneGptImage(input, refs, count);
    return this.runSceneNanoBanana(input, refs, count);
  }

  // Nano Banana (Gemini 2.5 Flash Image Edit) — multi-image composition.
  private async runSceneNanoBanana(
    input: ImageGenerationInput,
    refs: string[],
    count: number
  ): Promise<ImageGenerationResult> {
    const endpoint = 'fal-ai/nano-banana/edit';

    const tasks = Array.from({ length: count }, (_, i) => {
      const variation = `${i}_${Math.floor(Math.random() * 99999)}`;
      return this.callFal(endpoint, {
        prompt: `${input.prompt}\n\n[variation:${variation}]`,
        image_urls: refs,
        num_images: 1,
        output_format: 'png'
      });
    });

    const urls = await this.collectUrls(tasks, 'Nano Banana scene generation failed');
    return {
      success: true,
      outputUrls: urls,
      provider: 'Fal.ai',
      model: 'nano-banana-edit'
    };
  }

  // Ideogram Character — strongest face lock, weaker multi-reference composition.
  // Character sheet → reference_image_urls. First non-character guide → remix image.
  private async runSceneIdeogram(
    input: ImageGenerationInput,
    _refs: string[],
    count: number
  ): Promise<ImageGenerationResult> {
    const characterRef = input.characterSheetUrl;
    if (!characterRef) return this.runSceneNanoBanana(input, _refs, count);

    const remixGuide =
      input.poseRefUrl ||
      input.outfitRefUrl ||
      input.locationRefUrl ||
      input.propRefUrl;
    const useRemix = !!remixGuide && remixGuide !== characterRef;
    const endpoint = useRemix ? 'fal-ai/ideogram/character/remix' : 'fal-ai/ideogram/character';
    const aspectRatio = input.aspectRatio || '1:1';

    const tasks = Array.from({ length: count }, () => {
      const seed = Math.floor(Math.random() * 99999999);
      const payload: Record<string, any> = {
        prompt: `${input.prompt}\n[seed:${seed}]`,
        reference_image_urls: [characterRef],
        aspect_ratio: aspectRatio,
        rendering_speed: 'BALANCED'
      };
      if (useRemix && remixGuide) payload.image_url = remixGuide;
      return this.callFal(endpoint, payload);
    });

    const urls = await this.collectUrls(tasks, 'Ideogram Character scene generation failed');
    return {
      success: true,
      outputUrls: urls,
      provider: 'Fal.ai',
      model: useRemix ? 'ideogram-character-remix' : 'ideogram-character'
    };
  }

  // GPT Image 2 Edit — strongest text/label fidelity, slower & pricier.
  // Fal-hosted via openai/gpt-image-2/edit (no extra API key needed).
  private async runSceneGptImage(
    input: ImageGenerationInput,
    refs: string[],
    count: number
  ): Promise<ImageGenerationResult> {
    const endpoint = 'openai/gpt-image-2/edit';
    const image_size = this.mapGptImageSize(input.aspectRatio);

    const tasks = Array.from({ length: count }, (_, i) => {
      const variation = `${i}_${Math.floor(Math.random() * 99999)}`;
      return this.callFal(endpoint, {
        prompt: `${input.prompt}\n\n[variation:${variation}]`,
        image_urls: refs,
        image_size,
        num_images: 1,
        quality: 'high'
      });
    });

    const urls = await this.collectUrls(tasks, 'GPT Image scene generation failed');
    return {
      success: true,
      outputUrls: urls,
      provider: 'Fal.ai',
      model: 'gpt-image-2-edit'
    };
  }

  // No reference at all — fall back to text-to-image.
  private async runSceneTextOnly(input: ImageGenerationInput, count: number): Promise<ImageGenerationResult> {
    const endpoint = 'fal-ai/ideogram/v3';
    const aspectRatio = input.aspectRatio || '1:1';

    const tasks = Array.from({ length: count }, () => {
      const seed = Math.floor(Math.random() * 99999999);
      const payload: Record<string, any> = {
        prompt: `${input.prompt}\n[seed:${seed}]`,
        aspect_ratio: aspectRatio,
        rendering_speed: 'BALANCED',
        style: 'REALISTIC'
      };
      if (input.negativePrompt) payload.negative_prompt = input.negativePrompt;
      return this.callFal(endpoint, payload);
    });

    const urls = await this.collectUrls(tasks, 'Text-to-image scene generation failed');
    return {
      success: true,
      outputUrls: urls,
      provider: 'Fal.ai',
      model: 'ideogram-v3'
    };
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------
  private async callFal(endpoint: string, payload: Record<string, any>): Promise<string> {
    const res = await fetch(`${FAL_RUN_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data: FalImageResponse = await res.json().catch(() => ({} as FalImageResponse));
    if (!res.ok) {
      const detail = data.detail;
      const detailMsg = typeof detail === 'object' && detail !== null
        ? JSON.stringify(detail)
        : (typeof detail === 'string' ? detail : '');
      const errorMsg = detailMsg || data.message || (typeof data.error === 'string' ? data.error : '') || `Fal.ai ${endpoint} returned ${res.status}`;
      throw new Error(errorMsg);
    }

    const url = data.images?.[0]?.url;
    if (!url) throw new Error(`Fal.ai ${endpoint} response missing image URL`);
    return url;
  }

  private async collectUrls(tasks: Promise<string>[], fallbackError: string): Promise<string[]> {
    const settled = await Promise.allSettled(tasks);
    const urls: string[] = [];
    let lastError: unknown = null;
    for (const r of settled) {
      if (r.status === 'fulfilled') urls.push(r.value);
      else lastError = r.reason;
    }
    if (urls.length === 0) {
      const msg = lastError instanceof Error ? lastError.message : String(lastError || fallbackError);
      throw new Error(msg);
    }
    return urls;
  }

  // openai/gpt-image-2 endpoints on Fal use Fal-style preset size names,
  // not raw OpenAI pixel dimensions.
  private mapGptImageSize(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9':
        return 'landscape_16_9';
      case '4:3':
      case '3:2':
        return 'landscape_4_3';
      case '9:16':
        return 'portrait_16_9';
      case '4:5':
      case '2:3':
        return 'portrait_4_5';
      case '1:1':
      default:
        return 'square_hd';
    }
  }
}
export default FalImageProvider;
