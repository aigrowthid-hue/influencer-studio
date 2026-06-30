export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'agency' | 'enterprise';
  creditBalance: number;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface CharacterProfile {
  name?: string;
  // Basic Identity
  gender: string;
  ageRange: string;
  visualOrigin: string;
  faceShape: string;
  skinTone: string;
  bodyType: string;
  height: string;
  personalityVibe: string;
  niche: string;

  // Facial Detail
  eyeShape: string;
  noseShape: string;
  lips: string;
  eyebrows: string;
  cheekbones: string;
  jawline: string;
  skinDetail: string;

  // Hair Detail
  hairLength: string;
  hairColor: string;
  hairStyle: string;
  bangs: string;
  hairTexture: string;
  hairStrands: string;

  // Outfit Default
  topOutfit: string;
  bottomOutfit: string;
  shoes: string;
  accessories: string;
  colorPalette: string;
  styleVibe: string;

  // Unique Markers
  glasses: string;
  earrings: string;
  tattoo: string;
  mole: string;
  scar: string;
  bracelet: string;
  watch: string;
  signatureItem: string;

  // New prompt variables
  makeupStyle?: string;
  posture?: string;
  bodyProportion?: string;
  outfitMaterial?: string;
  outfitFit?: string;
  necklace?: string;
  rings?: string;
  piercings?: string;
  bag?: string;
  nailStyle?: string;
  referenceImageUrl?: string;
  identityLock?: string;
}

export interface Character {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  niche: string;
  profileJson: CharacterProfile;
  visualDna: string;
  characterSheetUrl: string;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export type AssetType = 'character_sheet' | 'face_closeup' | 'outfit_ref' | 'pose_ref' | 'location_ref' | 'prop_ref';

export interface CharacterAsset {
  id: string;
  characterId: string;
  type: AssetType;
  fileUrl: string;
  metadataJson: Record<string, any>;
  createdAt: string;
}

export type GenerationType = 'character_sheet' | 'scene_image' | 'variation' | 'video';
export type GenerationStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export interface Generation {
  id: string;
  userId: string;
  projectId: string;
  characterId: string | null;
  type: GenerationType;
  provider: string;
  model: string;
  prompt: string;
  negativePrompt: string;
  inputAssetsJson: Record<string, any>;
  outputUrl: string | null;
  outputThumbnailUrl: string | null;
  status: GenerationStatus;
  errorMessage: string | null;
  creditsUsed: number;
  createdAt: string;
}

export interface Video {
  id: string;
  userId: string;
  characterId: string | null;
  sourceImageGenerationId: string;
  provider: string;
  model: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  status: GenerationStatus;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  creditsUsed: number;
  createdAt: string;
}

export interface CreditLedger {
  id: string;
  userId: string;
  action: 'grant' | 'deduct' | 'refund' | 'purchase';
  amount: number;
  generationId: string | null;
  description: string;
  createdAt: string;
}

export interface PromptPreset {
  id: string;
  userId: string | null; // null for default public presets
  name: string;
  type: 'character' | 'scene' | 'video';
  promptTemplate: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  providerName: string;
  type: 'image' | 'video';
  modelName: string;
  isActive: boolean;
  configJson: Record<string, any>;
  createdAt: string;
}
