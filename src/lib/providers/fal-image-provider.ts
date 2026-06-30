import { IImageProvider, ImageGenerationInput, ImageGenerationResult } from './image-provider';

export class FalImageProvider implements IImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    try {
      // Map ratios to Fal.ai image sizes
      let image_size = 'square_hd';
      if (input.aspectRatio === '16:9') {
        image_size = 'landscape_16_9';
      } else if (input.aspectRatio === '4:5' || input.aspectRatio === '9:16') {
        image_size = 'portrait_4_5';
      }

      // We use the specialized fal-ai/ideogram/character models for scene generation 
      // when a character sheet reference is available, to ensure 100% face and identity consistency.
      const useIdeogramCharacter = input.workflow === 'scene' && !!input.characterSheetUrl;

      // For base image canvas in Remix/Edit, we prioritize Pose, Outfit, and Location references 
      // which contain human shapes or scene structures. Product references should only be generated 
      // via text prompts to prevent the product bottle from warping into a human canvas.
      const editRefUrl = input.poseRefUrl || input.outfitRefUrl || input.locationRefUrl || (useIdeogramCharacter ? '' : input.propRefUrl);
      
      // Determine if we should trigger image-to-image remix mode (requires a guide image)
      // or standard text-to-image character mode (when no guide images are present).
      const hasGuideImage = editRefUrl && editRefUrl.trim() !== '';
      const useRemixMode = useIdeogramCharacter && hasGuideImage;
      const useEditEndpoint = !useIdeogramCharacter && !!editRefUrl && input.workflow !== 'character_sheet';

      let modelEndpoint = 'openai/gpt-image-2';
      if (useIdeogramCharacter) {
        modelEndpoint = useRemixMode 
          ? 'fal-ai/ideogram/character/remix' 
          : 'fal-ai/ideogram/character';
      } else if (useEditEndpoint) {
        modelEndpoint = 'openai/gpt-image-2/edit';
      }

      // Build body parameters
      const payload: Record<string, any> = {};

      if (useIdeogramCharacter) {
        payload.prompt = input.prompt;
        payload.reference_image_urls = [input.characterSheetUrl];
        if (useRemixMode) {
          payload.image_url = editRefUrl;
        }
        if (input.aspectRatio) {
          payload.aspect_ratio = input.aspectRatio;
        }
      } else {
        payload.prompt = input.prompt;
        payload.image_size = image_size;
        if (useEditEndpoint) {
          payload.image_urls = [editRefUrl];
        }
      }

      const count = input.outputCount || 1;
      const promises = Array.from({ length: count }, (_, index) => {
        // Append a unique cache buster tag to the prompt to force Fal.ai and DALL-E to generate a unique image,
        // preventing API cache duplication for identical prompts and ensuring distinct faces/poses.
        const uniquePrompt = `${input.prompt}\n[Seed: ${Math.floor(Math.random() * 99999999)}_${index}]`;
        const requestPayload = {
          ...payload,
          prompt: uniquePrompt
        };

        return fetch(`https://fal.run/${modelEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${this.apiKey}`
          },
          body: JSON.stringify(requestPayload)
        }).then(async (res) => {
          const resData = await res.json();
          if (!res.ok) {
            const errorMsg = typeof resData.detail === 'object'
              ? JSON.stringify(resData.detail)
              : (resData.detail || resData.message || `Fal.ai image API (${modelEndpoint}) error`);
            throw new Error(errorMsg);
          }
          const url = resData.images?.[0]?.url;
          if (!url) {
            throw new Error('No image URL returned by Fal.ai');
          }
          return url;
        });
      });

      const results = await Promise.allSettled(promises);
      const outputUrls: string[] = [];
      let lastError: any = null;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          outputUrls.push(result.value);
        } else {
          lastError = result.reason;
        }
      });

      if (outputUrls.length === 0) {
        throw lastError || new Error('No images could be generated');
      }

      return {
        success: true,
        outputUrls,
        provider: 'Fal.ai',
        model: useIdeogramCharacter ? (useRemixMode ? 'ideogram-character-remix' : 'ideogram-character') : (useEditEndpoint ? 'gpt-image-2-edit' : 'gpt-image-2')
      };

    } catch (error: any) {
      console.error('Fal.ai image generation error:', error);
      return {
        success: false,
        outputUrls: [],
        errorMessage: error.message || 'Unknown Fal.ai image generation error',
        provider: 'Fal.ai',
        model: 'gpt-image-2'
      };
    }
  }
}
export default FalImageProvider;
