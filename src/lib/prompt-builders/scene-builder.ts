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
    identityRefPhrase = `the ${ordinal(pos)} reference image (${name}'s identity portrait)`;
    refLines.push(`${ordinal(pos)} image = ${name}'s identity portrait — this is a single close-up portrait of ${name}. Use this as the absolute source of truth for ${pron.poss} face shape, eyes, nose, mouth, hair color, hair style, skin tone, and any signature features. The person you generate MUST look like this exact same person; do not invent a different face.`);
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
    productClause = `CRITICAL — Product fidelity: ${name} is holding and clearly featuring the exact product shown in the ${ordinal(pos)} reference image. The product must be reproduced at full sharpness with these rules: (1) the shape, proportions, and silhouette of the packaging must match the reference pixel-for-pixel; (2) all label artwork, brand name, product name, and any text or numbers on the packaging must remain exactly as in the reference and must be crisp and clearly readable, not blurred or stylized; (3) the colors of the packaging must match the reference exactly; (4) do not warp, melt, or distort the product. The product should be held at a natural angle that shows the front label clearly toward the camera and should be a prominent visual focus of the composition.`;
    refLines.push(`${ordinal(pos)} image = product reference — reproduce the product at full resolution; the label, brand name, text, and packaging colors must be pixel-accurate and crisp.`);
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

  const negativePrompt = `different person, lookalike, sibling, face swap, distorted face, deformed face, asymmetric face, bad anatomy, extra limbs, extra fingers, mutated hands, blurry, low quality, plastic skin, over-smoothed, cartoon, anime, illustration, 3d render, cgi, watermark, text overlay, logo overlay, altered product label, changed product packaging, blurred product, low-resolution product, distorted product, melted packaging, unreadable label, fake brand name, generic packaging`;

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
