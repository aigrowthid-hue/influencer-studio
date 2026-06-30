import { CharacterProfile } from '@/types';
import { PromptBuildResult } from './character-sheet-builder';

interface SceneBuilderInput {
  characterProfile: CharacterProfile;
  sceneDescription: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
  cameraAngle?: string;
  shotType?: string;
  lensStyle?: string;
  lighting?: string;
  pose?: string;
  expression?: string;
  action?: string;
  outfitInstruction?: string;
  props?: string;
  productPlacement?: string;
  realismLevel?: string;
  contentType?: string;
  hasLocationRef?: boolean;
  hasOutfitRef?: boolean;
  hasPoseRef?: boolean;
  hasProductRef?: boolean;
  mood?: string;
  colorTone?: string;
  characterName?: string;
  useAdvanced?: boolean;
}

export function buildScenePrompt(input: SceneBuilderInput): PromptBuildResult {
  const {
    characterProfile: profile,
    sceneDescription,
    characterName,
    hasProductRef = false,
    hasOutfitRef = false,
    hasPoseRef = false,
    hasLocationRef = false,
  } = input;

  const name = characterName || profile.name || 'AI Influencer';

  // Add explicit guidance to the prompt based on uploaded reference files.
  // This directs the AI to perform the correct action (e.g. holding the product) without relying on robotic metadata.
  let guidanceText = '';
  if (hasProductRef) {
    guidanceText += ' She is holding the product bottle in her hand, displaying it clearly to the camera.';
  }
  if (hasOutfitRef) {
    guidanceText += ' She is wearing the style of clothing from the outfit reference.';
  }
  if (hasPoseRef) {
    guidanceText += ' She is posing in the exact same gesture and camera framing as the pose reference.';
  }
  if (hasLocationRef) {
    guidanceText += ' The background environment matches the location reference.';
  }

  // Build a clean, natural language prompt.
  // Ideogram handles character face consistency automatically using the reference image URL.
  // By keeping the prompt clean and natural, the AI can focus 100% on the scene description and location.
  const finalPrompt = `A realistic photo of ${name}, ${sceneDescription}.${guidanceText} Highly detailed, photorealistic, natural lighting.`.trim();

  const negativePrompt = `deformed face, lookalike, bad anatomy, blurry, low quality, distorted, extra limbs, bad proportions`;

  return {
    finalPrompt,
    negativePrompt,
    workflow: 'scene_image',
    identityPriority: 'character_sheet',
    referenceUsage: {
      characterSheet: 'identity, face, body, skin tone, hairstyle, unique markers',
      locationReference: 'background only',
      outfitReference: 'clothing only',
      poseReference: 'pose and framing only',
      productReference: 'product or prop only'
    },
    safetyNotes: [
      'Do not create real-person impersonation without permission.',
      'Do not copy celebrity or public figure identity.'
    ],
    promptBreakdown: {
      identity: `Selected AI Influencer: ${name}`,
      faceDetails: 'Locked via reference image',
      hairDetails: 'Locked via reference image',
      bodyDetails: 'Locked via reference image',
      uniqueMarkers: 'Locked via reference image',
      baseOutfit: 'Locked via reference image',
      requiredPanels: 'Single composed scene composition',
      styleRules: 'Realistic photo, photorealistic, natural lighting'
    }
  };
}
export default buildScenePrompt;
