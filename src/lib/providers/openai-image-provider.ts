import { IImageProvider, ImageGenerationInput, ImageGenerationResult } from './image-provider';

export class OpenAIImageProvider implements IImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    try {
      // DALL-E 2 only supports square (1024x1024)
      const size = '1024x1024';

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-2',
          prompt: input.prompt,
          n: 1,
          size
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      const outputUrl = data.data?.[0]?.url;
      if (!outputUrl) {
        throw new Error('No image URL returned by OpenAI');
      }

      return {
        success: true,
        outputUrls: [outputUrl],
        provider: 'OpenAI',
        model: 'dall-e-2'
      };

    } catch (error: any) {
      console.error('OpenAI generation error:', error);
      return {
        success: false,
        outputUrls: [],
        errorMessage: error.message || 'Unknown OpenAI error',
        provider: 'OpenAI',
        model: 'dall-e-2'
      };
    }
  }
}
export default OpenAIImageProvider;
