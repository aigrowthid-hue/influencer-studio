export interface ImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  outputCount?: number;
  characterProfile?: any;
  characterSheetUrl?: string;
  locationRefUrl?: string;
  outfitRefUrl?: string;
  poseRefUrl?: string;
  propRefUrl?: string;
  workflow?: 'character_sheet' | 'scene';
}

export interface ImageGenerationResult {
  success: boolean;
  outputUrls: string[];
  errorMessage?: string;
  provider: string;
  model: string;
}

export interface IImageProvider {
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}
