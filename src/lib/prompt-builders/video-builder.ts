import { PromptBuildResult } from './character-sheet-builder';

interface VideoBuilderInput {
  videoType?: string;
  duration?: number;
  aspectRatio?: string;
  cameraMovement?: string;
  characterMovement?: string;
  facialExpression?: string;
  gesture?: string;
  dialogue?: string;
  style?: string;
}

export function buildVideoPrompt(input: VideoBuilderInput): PromptBuildResult {
  const {
    videoType = 'ugc',
    duration = 5,
    cameraMovement = 'slow forward zoom',
    characterMovement = 'subtle head turn and looking at the camera',
    facialExpression = 'warm smile',
    gesture = 'none',
    dialogue,
    style = 'UGC / smartphone video'
  } = input;

  let promptBody = `Animate the provided image into a realistic short video. Keep the same person, same face, same outfit, same environment, and same visual composition from the source image.

Character Action:
The character should ${characterMovement}${gesture && gesture !== 'none' ? ` and make ${gesture}` : ''}.

Camera Motion:
The camera should ${cameraMovement}.

Facial expression:
Facial expression should be ${facialExpression}. Movement must be natural, subtle, and realistic.`;

  if (dialogue && dialogue.trim().length > 0) {
    promptBody += `

Speaking & Dialogue:
The character speaks naturally, looking at the camera. Lip movement should match the dialogue as closely as possible.
Dialogue: "${dialogue}"`;
  }

  promptBody += `

Video Style:
${style}, natural lighting, natural skin texture, 24fps, high definition, no exaggerated motion, no sudden camera cuts, no text overlay, no subtitles, no watermark, no transition, no background music.`;

  const negativePrompt = `Do not change the person’s identity. Do not morph the face. Do not change outfit. Do not change background drastically. No extra limbs, no distorted mouth, no unnatural lip movement, no random text, no watermark, no subtitles unless requested.`;

  return {
    finalPrompt: promptBody.trim(),
    negativePrompt,
    promptBreakdown: {
      identity: 'Retained from source image',
      camera: cameraMovement,
      motion: `${characterMovement}, ${gesture}`,
      references: ['Source Image']
    }
  };
}
export default buildVideoPrompt;
