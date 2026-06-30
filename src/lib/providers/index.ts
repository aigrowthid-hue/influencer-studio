import db from '@/lib/db/json-db';
import { IImageProvider } from './image-provider';
import { IVideoProvider } from './video-provider';
import { MockImageProvider } from './mock-image-provider';
import { MockVideoProvider } from './mock-video-provider';

export async function getImageProvider(): Promise<IImageProvider> {
  try {
    // 1. Check for Fal.ai Environment Variable override
    if (process.env.FAL_API_KEY) {
      const { FalImageProvider } = await import('./fal-image-provider');
      return new FalImageProvider(process.env.FAL_API_KEY);
    }

    // 2. Check for OpenAI Environment Variable overrides
    if (process.env.OPENAI_API_KEY) {
      const { OpenAIImageProvider } = await import('./openai-image-provider');
      return new OpenAIImageProvider(process.env.OPENAI_API_KEY);
    }

    // 3. Check Database configs
    const configs = await db.getProviderConfigs();
    const openAIConfig = configs.find(c => c.providerName === 'OpenAI');

    if (openAIConfig?.isActive && openAIConfig.configJson.apiKey) {
      // Dynamic import to avoid compiling OpenAI dependencies in pure mock setups
      const { OpenAIImageProvider } = await import('./openai-image-provider');
      return new OpenAIImageProvider(openAIConfig.configJson.apiKey);
    }
  } catch (err) {
    console.warn('Failed to initialize Image Provider, falling back to Mock:', err);
  }
  return new MockImageProvider();
}

export async function getVideoProvider(): Promise<IVideoProvider> {
  try {
    // 1. Check for Fal.ai Environment Variable override
    if (process.env.FAL_API_KEY) {
      const { FalVideoProvider } = await import('./fal-video-provider');
      return new FalVideoProvider(process.env.FAL_API_KEY);
    }

    // 2. Check for Google Veo Environment Variable overrides
    if (process.env.GOOGLE_API_KEY) {
      const { GoogleVeoProvider } = await import('./google-veo-provider');
      return new GoogleVeoProvider({
        apiKey: process.env.GOOGLE_API_KEY,
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION
      });
    }

    // 3. Check Database configs
    const configs = await db.getProviderConfigs();
    const veoConfig = configs.find(c => c.providerName === 'Google Veo');

    if (veoConfig?.isActive && veoConfig.configJson.apiKey) {
      const { GoogleVeoProvider } = await import('./google-veo-provider');
      return new GoogleVeoProvider(veoConfig.configJson as { apiKey: string; project?: string; location?: string });
    }
  } catch (err) {
    console.warn('Failed to initialize Video Provider, falling back to Mock:', err);
  }
  return new MockVideoProvider();
}
