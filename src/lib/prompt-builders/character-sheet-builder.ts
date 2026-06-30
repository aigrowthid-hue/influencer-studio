import { CharacterProfile } from '@/types';

export interface PromptBuildResult {
  finalPrompt: string;
  negativePrompt: string;
  workflow?: string;
  identityPriority?: string;
  referenceUsage?: {
    characterSheet: string;
    locationReference: string;
    outfitReference: string;
    poseReference: string;
    productReference: string;
  };
  safetyNotes?: string[];
  promptBreakdown: {
    identity: string;
    faceDetails?: string;
    hairDetails?: string;
    bodyDetails?: string;
    uniqueMarkers?: string;
    baseOutfit?: string;
    requiredPanels?: string;
    styleRules?: string;
    scene?: string;
    camera?: string;
    lighting?: string;
    motion?: string;
    references?: string[];
  };
}

export const CHARACTER_SHEET_SYSTEM_PROMPT = `
You are an expert character designer and digital portrait artist specializing in creating high-fidelity, photorealistic multi-angle character reference sheets (model sheets) for consistent character generation.

Your primary goal is to establish and lock one single fictional character identity with maximum facial, structural, and anatomical consistency across all views.

Adhere to these strict operational rules:
1. Identity Consistency: The character must look like the exact same individual in every view. Maintain skull shape, eye spacing, nose bridge shape, lip fullness, jawline definition, ear placement, hairline, hair texture, skin tone, and unique markers.
2. Anti-Lookalike Policy: Prevent variations that look like lookalikes or siblings instead of the same person. Proportions and features must match pixel-for-pixel across all angles.
3. Anatomical Precision: Prioritize body structure, bone structure, joint placement, and realistic physical proportions.
4. Neutral Fitted Base Outfit: Keep the clothing as a neutral, form-fitting base (navy blue form-fitting tank top and matching navy blue fitted shorts) to ensure it does not distract from the character's physical geometry. Outfit styling will be swapped later.
5. Photography Style: Output a clean, high-resolution photographic design board in an exact 3x3 grid layout (9 panels). Plain solid light grey/off-white studio background. Uniform soft neutral studio lighting.
`.trim();

export function buildCharacterSheetPrompt(profile: CharacterProfile, style = 'realistic'): PromptBuildResult {
  const name = profile.name || 'AI Influencer';
  const gender = profile.gender || 'Female';
  const age = profile.ageRange || '20-25';
  const nationality = profile.visualOrigin || 'East Asian';

  // Face details - Aligned with character-sheet-builder
  const faceShape = profile.faceShape ? `Face Shape: ${profile.faceShape}` : 'oval face shape';
  const eyeShape = profile.eyeShape ? `Eye Shape: ${profile.eyeShape}` : 'almond eyes';
  const nose = profile.noseShape ? `Nose: ${profile.noseShape}` : 'straight nose';
  const lips = profile.lips ? `Lips: ${profile.lips}` : 'natural lips';
  const skinTone = profile.skinTone ? `Skin Tone: ${profile.skinTone}` : 'neutral skin tone';
  const skinTexture = profile.skinDetail ? `Skin Texture: ${profile.skinDetail}` : 'visible pores, realistic texture';
  const makeupStyle = profile.makeupStyle ? `Makeup Style: ${profile.makeupStyle}` : 'minimal natural makeup';
  const expression = profile.personalityVibe ? `Expression: ${profile.personalityVibe}` : 'soft friendly expression';

  const faceDetailsText = `Face details: ${faceShape}, ${eyeShape}, ${nose}, ${lips}, ${skinTone}, ${skinTexture}, ${makeupStyle}, ${expression}.`;

  // Hair details - Aligned with character-sheet-builder
  const hairColor = profile.hairColor ? `Hair Color: ${profile.hairColor}` : 'dark hair';
  const hairLength = profile.hairLength ? `Hair Length: ${profile.hairLength}` : 'medium hair';
  const hairstyle = profile.hairStyle ? `Hairstyle: ${profile.hairStyle}` : 'straight hair';
  const bangs = profile.bangs ? `Bangs: ${profile.bangs}` : 'no bangs';
  const hairTexture = profile.hairTexture ? `Hair Texture: ${profile.hairTexture}` : 'fine hair texture';
  const hairDetails = profile.hairStrands ? `Hair Details: ${profile.hairStrands}` : 'natural hair strands';

  const hairDetailsText = `Hair details: ${hairColor}, ${hairLength}, ${hairstyle}, ${bangs}, ${hairTexture}, ${hairDetails}.`;

  // Body details - Aligned with character-sheet-builder
  const bodyType = profile.bodyType ? `Body Type: ${profile.bodyType}` : 'slim fit body';
  const height = profile.height ? `Height: ${profile.height}` : 'average height';
  const posture = profile.posture ? `Posture: ${profile.posture}` : 'standing straight';
  const proportion = profile.bodyProportion ? `Proportion: ${profile.bodyProportion}` : 'natural human proportions';

  const bodyDetailsText = `Body details: ${bodyType}, ${height}, ${posture}, ${proportion}, realistic human anatomy, consistent body shape across all views.`;

  // Outfit details (Downgraded to navy blue athletic tank/shorts base wear)
  const topOutfit = profile.topOutfit?.trim() || 'navy blue form-fitting tank top';
  const bottomOutfit = profile.bottomOutfit?.trim() || 'matching navy blue fitted shorts';
  const shoes = profile.shoes?.trim() || 'none (barefoot)';
  const accessories = profile.accessories?.trim() || 'none';
  const colorPalette = profile.colorPalette?.trim() || 'navy blue and solid neutral off-white background';
  const styleVibe = profile.styleVibe?.trim() || 'minimalist fitted base athletic wear';

  const baseOutfitText = `Outfit details: Top: ${topOutfit}, Bottom: ${bottomOutfit}, Shoes: ${shoes}, Accessories: ${accessories}, Color Palette: ${colorPalette}, Vibe: ${styleVibe}.`;

  // Unique markers
  const glasses = profile.glasses ? `Glasses: ${profile.glasses}` : 'none';
  const earrings = profile.earrings ? `Earrings: ${profile.earrings}` : 'none';
  const tattoo = profile.tattoo ? `Tattoo: ${profile.tattoo}` : 'none';
  const mole = profile.mole ? `Mole/Freckles: ${profile.mole}` : 'none';
  const scar = profile.scar ? `Scar: ${profile.scar}` : 'none';
  const bracelet = profile.bracelet ? `Bracelet: ${profile.bracelet}` : 'none';
  const watch = profile.watch ? `Watch: ${profile.watch}` : 'none';
  const signatureItem = profile.signatureItem ? `Signature Detail: ${profile.signatureItem}` : 'none';

  const uniqueMarkersText = `Unique identity markers: ${glasses}, ${earrings}, ${tattoo}, ${mole}, ${scar}, ${bracelet}, ${watch}, ${signatureItem}.`;

  // Required panels (3x3 Grid, 9 panels)
  const requiredPanels = [
    'close-up front view portrait, chest-up',
    'close-up 3/4 front left view portrait, chest-up',
    'close-up 3/4 front right view portrait, chest-up',
    'close-up left side profile portrait, chest-up',
    'close-up right side profile portrait, chest-up',
    'close-up top-tilt portrait (head slightly tilted up), chest-up',
    'close-up bottom-tilt portrait (head slightly tilted down/looking down), chest-up',
    'close-up back view portrait showing hair length and texture, chest-up',
    'full body front view portrait standing'
  ];

  const requiredPanelsText = `The board MUST display the SAME character consistently across these exact 9 panels in a clean 3x3 grid layout:\n` + requiredPanels.map((panel, idx) => `${idx + 1}. ${panel}`).join('\n');

  // Style rules
  const styleRulesText = `Style & Layout: Clean professional character design board, plain solid light grey/off-white studio background, organized 3x3 grid layout, each view clearly separated, fashion model reference sheet, photorealistic character sheet, realistic skin texture, natural pores, slight imperfections, realistic hair strands, sharp focus, studio lighting, no exaggerated beauty filter, no plastic skin, no cartoon, no anime.`;

  // Reference Image logic
  const referenceInstruction = profile.referenceImageUrl
    ? `Use the provided reference image ONLY as identity inspiration. Do NOT repeat or copy the selfie directly. Instead, extract facial likeness cues (eyes, nose, jawline, visual origin) from it and transform them into a complete multi-angle identity sheet of the same person, maintaining full physical coherence across all panels.`
    : '';

  const finalPrompt = `
[SYSTEM_PROMPT]
${CHARACTER_SHEET_SYSTEM_PROMPT}

[REFERENCE_INSTRUCTION]
${referenceInstruction}

[IDENTITY_SPECS]
Character Name: ${name}
Gender Vibe: ${gender}
Age Range: ${age}
Visual Vibe: ${nationality}

[DETAILED_CHARACTER_ATTRIBUTES]
${faceDetailsText}
${hairDetailsText}
${bodyDetailsText}
${baseOutfitText}
${uniqueMarkersText}

[REQUIRED_PANELS]
${requiredPanelsText}

[STYLE_AND_LAYOUT_RULES]
${styleRulesText}

[IMPORTANT_COMPLIANCE]
The character must look like the EXACT same person across all 9 panels in the 3x3 grid. Keep facial structure, eyes, nose, hairstyle, outfit, body shape, and proportions consistent across all views.
`.trim();

  const negativePrompt = `Do not create multiple different people or lookalike variations. Do not change facial structure, hair length, eye color, or skin tone between panels. Do not change outfit or accessories between panels. Avoid generic lookalikes, siblings, cartoon, anime, illustrations, 3D renders, CGI, airbrushed plastic skin, over-smoothed filters, hand distortions, extra fingers, malformed feet, watermark, text labels, borders, grid lines, or background details.`;

  return {
    finalPrompt,
    negativePrompt,
    workflow: 'character_sheet',
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
      'Do not copy celebrity or public figure identity.',
      'Do not sexualize minors.'
    ],
    promptBreakdown: {
      identity: `Fictional ${age}-year-old ${nationality} ${gender} named ${name}.`,
      faceDetails: faceDetailsText,
      hairDetails: hairDetailsText,
      bodyDetails: bodyDetailsText,
      uniqueMarkers: uniqueMarkersText,
      baseOutfit: baseOutfitText,
      requiredPanels: requiredPanelsText,
      styleRules: styleRulesText
    }
  };
}

export default buildCharacterSheetPrompt;
