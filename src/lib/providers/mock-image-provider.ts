import { IImageProvider, ImageGenerationInput, ImageGenerationResult } from './image-provider';

// Curated high-quality consistent influencer templates
interface MockTemplate {
  characterSheet: string;
  scenes: {
    beach: string;
    cafe: string;
    city: string;
    studio: string;
    office: string;
    default: string;
  };
}

const TEMPLATES: Record<string, MockTemplate> = {
  'female_beauty': {
    characterSheet: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1200&q=80',
    scenes: {
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      city: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
      studio: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      office: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      default: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    }
  },
  'female_fitness': {
    characterSheet: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=1200&q=80',
    scenes: {
      beach: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
      cafe: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80',
      city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
      studio: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      default: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
    }
  },
  'female_hijab': {
    characterSheet: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1200&q=80',
    scenes: {
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      city: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      studio: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      office: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      default: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80'
    }
  },
  'male_fitness': {
    characterSheet: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
    scenes: {
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
      studio: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      default: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
    }
  },
  'male_tech': {
    characterSheet: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80',
    scenes: {
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      cafe: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      city: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
      studio: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      default: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
    }
  }
};

export class MockImageProvider implements IImageProvider {
  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    // Simulate generation latency (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const promptText = input.prompt.toLowerCase();
    
    // Determine which character template to use
    let templateKey = 'female_beauty'; // default
    
    if (input.characterProfile) {
      const gender = (input.characterProfile.gender || 'female').toLowerCase();
      const niche = (input.characterProfile.niche || 'beauty').toLowerCase();
      
      if (gender === 'female') {
        if (niche.includes('hijab') || niche.includes('modest')) {
          templateKey = 'female_hijab';
        } else if (niche.includes('fit') || niche.includes('sport')) {
          templateKey = 'female_fitness';
        } else {
          templateKey = 'female_beauty';
        }
      } else {
        if (niche.includes('fit') || niche.includes('sport') || niche.includes('coach')) {
          templateKey = 'male_fitness';
        } else {
          templateKey = 'male_tech';
        }
      }
    } else {
      // Deduce from prompt text
      if (promptText.includes('hijab') || promptText.includes('modest')) {
        templateKey = 'female_hijab';
      } else if (promptText.includes('fitness') || promptText.includes('gym')) {
        if (promptText.includes('man') || promptText.includes('male') || promptText.includes('guy')) {
          templateKey = 'male_fitness';
        } else {
          templateKey = 'female_fitness';
        }
      } else if (promptText.includes('man') || promptText.includes('male') || promptText.includes('guy') || promptText.includes('tech')) {
        templateKey = 'male_tech';
      }
    }

    const template = TEMPLATES[templateKey] || TEMPLATES['female_beauty'];

    // Check if this is a character sheet generation
    if (promptText.includes('character sheet') || promptText.includes('identity reference sheet')) {
      return {
        success: true,
        outputUrls: [template.characterSheet],
        provider: 'MockImageProvider',
        model: 'mock-sdxl-consistent'
      };
    }

    // Determine scene location based on prompt
    let sceneUrl = template.scenes.default;
    if (promptText.includes('beach') || promptText.includes('pantai') || promptText.includes('sunset')) {
      sceneUrl = template.scenes.beach;
    } else if (promptText.includes('cafe') || promptText.includes('coffee') || promptText.includes('kopi') || promptText.includes('restaurant')) {
      sceneUrl = template.scenes.cafe;
    } else if (promptText.includes('city') || promptText.includes('street') || promptText.includes('monas') || promptText.includes('road')) {
      sceneUrl = template.scenes.city;
    } else if (promptText.includes('studio') || promptText.includes('indoor photoshoot') || promptText.includes('lighting')) {
      sceneUrl = template.scenes.studio;
    } else if (promptText.includes('office') || promptText.includes('desk') || promptText.includes('work')) {
      sceneUrl = template.scenes.office;
    }

    // Return mock generated scene images (supports outputCount)
    const count = input.outputCount || 1;
    const outputs = Array.from({ length: count }, (_, i) => {
      // Add unique query parameter to bust cache and simulate variations
      return `${sceneUrl}?sig=${Math.floor(Math.random() * 100000)}&v=${i}`;
    });

    return {
      success: true,
      outputUrls: outputs,
      provider: 'MockImageProvider',
      model: 'mock-sdxl-consistent'
    };
  }
}
