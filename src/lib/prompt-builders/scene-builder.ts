import { CharacterProfile } from '@/types';
import { PromptBuildResult } from './character-sheet-builder';

interface SceneBuilderInput {
  characterProfile: CharacterProfile;
  characterName?: string;
  sceneDescription: string;
  identityLock?: string;
  hasCharacterSheet?: boolean;
  hasLocationRef?: boolean;
  hasOutfitRef?: boolean;
  hasPoseRef?: boolean;
  hasProductRef?: boolean;
  // Legacy fields kept for backwards compatibility — currently unused by the prompt.
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
  mood?: string;
  colorTone?: string;
  useAdvanced?: boolean;
}

function getPronouns(gender?: string) {
  const g = (gender || '').toLowerCase();
  if (g.startsWith('m')) return { subj: 'he', obj: 'him', poss: 'his' };
  if (g.startsWith('f') || g.startsWith('w')) return { subj: 'she', obj: 'her', poss: 'her' };
  return { subj: 'they', obj: 'them', poss: 'their' };
}

function buildCharacterAttributes(profile: CharacterProfile): string {
  const parts: string[] = [];

  const demo: string[] = [];
  if (profile.ageRange) demo.push(`${profile.ageRange} year-old`);
  if (profile.visualOrigin) demo.push(profile.visualOrigin);
  if (profile.gender) demo.push(profile.gender.toLowerCase());
  if (demo.length) parts.push(demo.join(' '));

  const face: string[] = [];
  if (profile.faceShape) face.push(`${profile.faceShape} face`);
  if (profile.skinTone) face.push(`${profile.skinTone} skin`);
  if (profile.eyeShape) face.push(`${profile.eyeShape} eyes`);
  if (profile.noseShape) face.push(profile.noseShape);
  if (profile.lips) face.push(`${profile.lips} lips`);
  if (face.length) parts.push(face.join(', '));

  const hair: string[] = [];
  if (profile.hairColor) hair.push(profile.hairColor);
  if (profile.hairLength) hair.push(profile.hairLength);
  if (profile.hairStyle) hair.push(profile.hairStyle);
  if (hair.length) parts.push(`${hair.join(' ')} hair`);

  if (profile.bodyType) parts.push(`${profile.bodyType} build`);
  if (profile.height) parts.push(profile.height);

  const markers: string[] = [];
  if (profile.glasses && profile.glasses !== 'none') markers.push(`wears ${profile.glasses}`);
  if (profile.signatureItem && profile.signatureItem !== 'none') markers.push(profile.signatureItem);
  if (profile.mole && profile.mole !== 'none') markers.push(`mole: ${profile.mole}`);
  if (profile.tattoo && profile.tattoo !== 'none') markers.push(`tattoo: ${profile.tattoo}`);
  if (markers.length) parts.push(`signature features — ${markers.join('; ')}`);

  return parts.join('; ');
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
const ordinal = (n: number) => ORDINALS[n - 1] || `${n}th`;

export function buildScenePrompt(input: SceneBuilderInput): PromptBuildResult {
  const {
    characterProfile: profile,
    sceneDescription,
    characterName,
    identityLock,
    hasCharacterSheet = true,
    hasLocationRef = false,
    hasOutfitRef = false,
    hasPoseRef = false,
    hasProductRef = false,
  } = input;

  const name = characterName || profile.name || 'the AI influencer';
  const pron = getPronouns(profile.gender);
  const attributes = buildCharacterAttributes(profile);

  // Reference image positions MUST match the order used by the provider in image_urls:
  //   1. characterSheet  2. outfit  3. pose  4. location  5. product
  let pos = 1;
  const refLines: string[] = [];
  let identityRefPhrase = '';
  let outfitClause = '';
  let poseClause = '';
  let locationClause = '';
  let productClause = '';

  if (hasCharacterSheet) {
    identityRefPhrase = `the ${ordinal(pos)} reference image (${name}'s character sheet)`;
    refLines.push(`${ordinal(pos)} image = ${name}'s identity / character sheet — use this as the absolute source of truth for ${pron.poss} face, hair, skin tone, body proportions, and signature features.`);
    pos++;
  }
  if (hasOutfitRef) {
    outfitClause = `${name} is wearing the exact outfit shown in the ${ordinal(pos)} reference image — replicate the clothing, color, fabric, fit, and styling faithfully.`;
    refLines.push(`${ordinal(pos)} image = outfit reference — copy the clothing exactly.`);
    pos++;
  }
  if (hasPoseRef) {
    poseClause = `${name} is posed in the exact body posture, hand gesture, and camera framing shown in the ${ordinal(pos)} reference image.`;
    refLines.push(`${ordinal(pos)} image = pose / framing reference — copy the body posture and shot framing exactly.`);
    pos++;
  }
  if (hasLocationRef) {
    locationClause = `The scene background and environment match the ${ordinal(pos)} reference image — replicate the location, lighting mood, and atmosphere.`;
    refLines.push(`${ordinal(pos)} image = location / background reference — replicate the environment and lighting mood.`);
    pos++;
  }
  if (hasProductRef) {
    productClause = `${name} is holding and clearly featuring the exact product shown in the ${ordinal(pos)} reference image. The product must be reproduced faithfully — its shape, color, label artwork, and any text or logo on the packaging must remain unchanged and clearly readable. The product should be a clear visual focus of the composition.`;
    refLines.push(`${ordinal(pos)} image = product reference — reproduce the product exactly (shape, color, label, text must be unchanged).`);
    pos++;
  }

  const identityBlock = identityLock?.trim()
    ? identityLock.trim()
    : `${name}${attributes ? ` — ${attributes}` : ''}. This is the same exact person in every generated scene; do not change ${pron.poss} face structure, hair, skin tone, or body proportions.`;

  const guideBlock = [outfitClause, poseClause, locationClause, productClause]
    .filter(Boolean)
    .join('\n');

  const refGuide = refLines.length
    ? `\n\nReference images (in order):\n${refLines.map(l => `  - ${l}`).join('\n')}`
    : '';

  const identityFallback = identityRefPhrase || 'the character description above';

  const finalPrompt = `Create a single photorealistic instagram-quality photo of ${name}.

Identity lock (do not change): ${identityBlock}

Scene: ${sceneDescription.trim()}

${guideBlock || `${name} is naturally placed in the scene above.`}

Style: photorealistic, natural lighting, sharp focus, realistic skin texture with visible pores, magazine-quality composition, no plastic skin, no over-smoothing, no cartoon or 3D look. ${name}'s face and identity must remain consistent with ${identityFallback}.${refGuide}`.trim();

  const negativePrompt = `different person, lookalike, sibling, face swap, distorted face, deformed face, asymmetric face, bad anatomy, extra limbs, extra fingers, mutated hands, blurry, low quality, plastic skin, over-smoothed, cartoon, anime, illustration, 3d render, cgi, watermark, text overlay, logo overlay, altered product label, changed product packaging`;

  return {
    finalPrompt,
    negativePrompt,
    workflow: 'scene_image',
    identityPriority: 'character_sheet',
    referenceUsage: {
      characterSheet: 'identity, face, body, skin tone, hairstyle, unique markers',
      locationReference: 'background and environment',
      outfitReference: 'clothing exactly',
      poseReference: 'body pose and camera framing',
      productReference: 'product reproduced faithfully'
    },
    safetyNotes: [
      'Do not create real-person impersonation without permission.',
      'Do not copy celebrity or public figure identity.'
    ],
    promptBreakdown: {
      identity: `Selected AI Influencer: ${name}`,
      faceDetails: attributes || 'Inherited from character sheet reference',
      hairDetails: 'Inherited from character sheet reference',
      bodyDetails: 'Inherited from character sheet reference',
      uniqueMarkers: 'Inherited from character sheet reference',
      baseOutfit: hasOutfitRef ? 'From outfit reference image' : 'From character sheet',
      requiredPanels: 'Single composed scene',
      styleRules: 'Photorealistic, natural lighting',
      scene: sceneDescription.trim()
    }
  };
}
export default buildScenePrompt;
