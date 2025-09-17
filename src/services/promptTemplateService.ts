import { supabase } from '@/integrations/supabase/client';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  technique: string;
  template: string;
  variables: TemplateVariable[];
  tags: string[];
  popularity: number;
  successRate: number;
  averageRating: number;
  createdBy: 'system' | 'user' | 'community';
  isPublic: boolean;
  examples: string[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  placeholder?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: PromptTemplate[];
}

export class PromptTemplateService {
  private static systemTemplates: PromptTemplate[] = [
    {
      id: 'traditional-rose',
      name: 'Traditional Rose',
      description: 'Classic traditional style rose tattoo',
      category: 'traditional',
      style: 'traditional',
      technique: 'line_work',
      template: 'A traditional tattoo of a {subject} with {color_scheme} colors, featuring bold black outlines and {additional_elements}. Classic americana style with {composition} composition.',
      variables: [
        {
          name: 'subject',
          description: 'Main subject of the tattoo',
          type: 'select',
          required: true,
          defaultValue: 'rose',
          options: ['rose', 'skull and rose', 'heart and rose', 'dagger and rose']
        },
        {
          name: 'color_scheme',
          description: 'Color palette',
          type: 'select',
          required: true,
          defaultValue: 'red and green',
          options: ['red and green', 'black and gray', 'full color', 'red only']
        },
        {
          name: 'additional_elements',
          description: 'Additional design elements',
          type: 'multiselect',
          required: false,
          options: ['thorns', 'leaves', 'banner', 'scroll', 'drops of blood', 'butterfly']
        },
        {
          name: 'composition',
          description: 'Overall composition style',
          type: 'select',
          required: true,
          defaultValue: 'balanced',
          options: ['balanced', 'vertical', 'horizontal', 'circular']
        }
      ],
      tags: ['traditional', 'rose', 'classic', 'americana'],
      popularity: 95,
      successRate: 92,
      averageRating: 4.7,
      createdBy: 'system',
      isPublic: true,
      examples: [
        'A traditional tattoo of a rose with red and green colors, featuring bold black outlines and thorns. Classic americana style with balanced composition.',
        'A traditional tattoo of a skull and rose with black and gray colors, featuring bold black outlines and banner. Classic americana style with vertical composition.'
      ]
    },
    {
      id: 'realistic-portrait',
      name: 'Realistic Portrait',
      description: 'Photorealistic portrait tattoo template',
      category: 'realistic',
      style: 'realistic',
      technique: 'shading',
      template: 'A photorealistic portrait tattoo of {subject} with {detail_level} detail, featuring {lighting_style} lighting and {background_type} background. {skin_tone} skin tones with {expression} expression.',
      variables: [
        {
          name: 'subject',
          description: 'Portrait subject',
          type: 'text',
          required: true,
          placeholder: 'e.g., woman, man, child, pet'
        },
        {
          name: 'detail_level',
          description: 'Level of detail',
          type: 'select',
          required: true,
          defaultValue: 'high',
          options: ['moderate', 'high', 'ultra-high']
        },
        {
          name: 'lighting_style',
          description: 'Lighting approach',
          type: 'select',
          required: true,
          defaultValue: 'dramatic',
          options: ['soft', 'dramatic', 'natural', 'studio']
        },
        {
          name: 'background_type',
          description: 'Background style',
          type: 'select',
          required: true,
          defaultValue: 'minimal',
          options: ['minimal', 'abstract', 'detailed', 'none']
        },
        {
          name: 'skin_tone',
          description: 'Skin tone rendering',
          type: 'select',
          required: true,
          defaultValue: 'natural',
          options: ['natural', 'warm', 'cool', 'high contrast']
        },
        {
          name: 'expression',
          description: 'Facial expression',
          type: 'select',
          required: false,
          defaultValue: 'serene',
          options: ['serene', 'smiling', 'serious', 'contemplative', 'joyful']
        }
      ],
      tags: ['realistic', 'portrait', 'photorealistic', 'detailed'],
      popularity: 88,
      successRate: 85,
      averageRating: 4.5,
      createdBy: 'system',
      isPublic: true,
      examples: [
        'A photorealistic portrait tattoo of woman with high detail, featuring dramatic lighting and minimal background. Natural skin tones with serene expression.',
        'A photorealistic portrait tattoo of pet with ultra-high detail, featuring soft lighting and abstract background. Warm skin tones with joyful expression.'
      ]
    },
    {
      id: 'geometric-mandala',
      name: 'Geometric Mandala',
      description: 'Sacred geometry and mandala designs',
      category: 'geometric',
      style: 'geometric',
      technique: 'line_work',
      template: 'A {complexity} geometric mandala tattoo with {pattern_type} patterns, featuring {line_style} lines and {symmetry_type} symmetry. {color_approach} design with {sacred_geometry} elements.',
      variables: [
        {
          name: 'complexity',
          description: 'Design complexity',
          type: 'select',
          required: true,
          defaultValue: 'intricate',
          options: ['simple', 'moderate', 'intricate', 'highly complex']
        },
        {
          name: 'pattern_type',
          description: 'Pattern style',
          type: 'multiselect',
          required: true,
          options: ['floral', 'geometric', 'tribal', 'celtic', 'aztec', 'mandala']
        },
        {
          name: 'line_style',
          description: 'Line work style',
          type: 'select',
          required: true,
          defaultValue: 'precise',
          options: ['fine', 'precise', 'bold', 'varied weight']
        },
        {
          name: 'symmetry_type',
          description: 'Symmetry pattern',
          type: 'select',
          required: true,
          defaultValue: 'radial',
          options: ['radial', 'bilateral', 'rotational', 'translational']
        },
        {
          name: 'color_approach',
          description: 'Color treatment',
          type: 'select',
          required: true,
          defaultValue: 'black ink',
          options: ['black ink', 'minimal color', 'full color', 'gradient']
        },
        {
          name: 'sacred_geometry',
          description: 'Sacred geometry elements',
          type: 'multiselect',
          required: false,
          options: ['flower of life', 'metatrons cube', 'golden ratio', 'fibonacci spiral', 'platonic solids']
        }
      ],
      tags: ['geometric', 'mandala', 'sacred geometry', 'symmetrical'],
      popularity: 82,
      successRate: 90,
      averageRating: 4.6,
      createdBy: 'system',
      isPublic: true,
      examples: [
        'An intricate geometric mandala tattoo with floral patterns, featuring precise lines and radial symmetry. Black ink design with flower of life elements.',
        'A moderate geometric mandala tattoo with geometric patterns, featuring bold lines and bilateral symmetry. Minimal color design with golden ratio elements.'
      ]
    },
    {
      id: 'watercolor-abstract',
      name: 'Watercolor Abstract',
      description: 'Flowing watercolor style designs',
      category: 'watercolor',
      style: 'watercolor',
      technique: 'watercolor',
      template: 'A watercolor tattoo of {subject} with {color_palette} colors, featuring {flow_style} paint flow and {texture_type} texture. {background_treatment} background with {artistic_elements}.',
      variables: [
        {
          name: 'subject',
          description: 'Main subject',
          type: 'text',
          required: true,
          placeholder: 'e.g., butterfly, flower, bird, abstract shape'
        },
        {
          name: 'color_palette',
          description: 'Color scheme',
          type: 'select',
          required: true,
          defaultValue: 'vibrant',
          options: ['vibrant', 'pastel', 'monochromatic', 'complementary', 'analogous']
        },
        {
          name: 'flow_style',
          description: 'Paint flow pattern',
          type: 'select',
          required: true,
          defaultValue: 'organic',
          options: ['organic', 'controlled', 'chaotic', 'directional']
        },
        {
          name: 'texture_type',
          description: 'Paint texture',
          type: 'select',
          required: true,
          defaultValue: 'soft blend',
          options: ['soft blend', 'paint drips', 'splatter', 'brush strokes']
        },
        {
          name: 'background_treatment',
          description: 'Background style',
          type: 'select',
          required: true,
          defaultValue: 'color wash',
          options: ['color wash', 'paint splash', 'gradient', 'clean']
        },
        {
          name: 'artistic_elements',
          description: 'Additional artistic elements',
          type: 'multiselect',
          required: false,
          options: ['paint drips', 'color bleeds', 'brush textures', 'paper texture', 'ink bleeds']
        }
      ],
      tags: ['watercolor', 'abstract', 'artistic', 'flowing'],
      popularity: 75,
      successRate: 78,
      averageRating: 4.3,
      createdBy: 'system',
      isPublic: true,
      examples: [
        'A watercolor tattoo of butterfly with vibrant colors, featuring organic paint flow and soft blend texture. Color wash background with paint drips.',
        'A watercolor tattoo of flower with pastel colors, featuring controlled paint flow and brush strokes texture. Gradient background with color bleeds.'
      ]
    }
  ];

  /**
   * Get all available template categories
   */
  static getTemplateCategories(): TemplateCategory[] {
    const categories: Record<string, TemplateCategory> = {};

    this.systemTemplates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = {
          id: template.category,
          name: this.getCategoryDisplayName(template.category),
          description: this.getCategoryDescription(template.category),
          icon: this.getCategoryIcon(template.category),
          templates: []
        };
      }
      categories[template.category].templates.push(template);
    });

    return Object.values(categories);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.systemTemplates.filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): PromptTemplate | null {
    return this.systemTemplates.find(t => t.id === id) || null;
  }

  /**
   * Render template with variables
   */
  static renderTemplate(
    template: PromptTemplate,
    variables: Record<string, string | string[]>
  ): string {
    let rendered = template.template;

    template.variables.forEach(variable => {
      const value = variables[variable.name];
      let replacement = '';

      if (value) {
        if (Array.isArray(value)) {
          replacement = value.join(', ');
        } else {
          replacement = value;
        }
      } else if (variable.defaultValue) {
        replacement = variable.defaultValue;
      } else if (variable.required) {
        replacement = `[${variable.name.toUpperCase()}]`;
      }

      const placeholder = `{${variable.name}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return rendered;
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.systemTemplates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get popular templates
   */
  static getPopularTemplates(limit: number = 5): PromptTemplate[] {
    return [...this.systemTemplates]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get high-success templates
   */
  static getHighSuccessTemplates(limit: number = 5): PromptTemplate[] {
    return [...this.systemTemplates]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  /**
   * Validate template variables
   */
  static validateTemplateVariables(
    template: PromptTemplate,
    variables: Record<string, string | string[]>
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    template.variables.forEach(variable => {
      const value = variables[variable.name];

      if (variable.required && (!value || (Array.isArray(value) && value.length === 0))) {
        errors.push(`${variable.name} is required`);
      }

      if (value && variable.type === 'select' && variable.options) {
        if (!variable.options.includes(value as string)) {
          errors.push(`${variable.name} must be one of: ${variable.options.join(', ')}`);
        }
      }

      if (value && variable.type === 'multiselect' && variable.options) {
        const invalidOptions = (value as string[]).filter(v => !variable.options!.includes(v));
        if (invalidOptions.length > 0) {
          errors.push(`${variable.name} contains invalid options: ${invalidOptions.join(', ')}`);
        }
      }

      if (!value && !variable.required && !variable.defaultValue) {
        warnings.push(`${variable.name} is empty and has no default value`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      traditional: 'Traditional',
      realistic: 'Realistic',
      geometric: 'Geometric',
      watercolor: 'Watercolor',
      minimalist: 'Minimalist',
      tribal: 'Tribal',
      japanese: 'Japanese',
      blackwork: 'Blackwork'
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private static getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      traditional: 'Classic American traditional tattoo designs with bold lines and solid colors',
      realistic: 'Photorealistic portraits and detailed representations',
      geometric: 'Sacred geometry, mandalas, and precise geometric patterns',
      watercolor: 'Flowing, paint-like designs with soft color transitions',
      minimalist: 'Simple, clean designs with minimal elements',
      tribal: 'Bold tribal patterns and cultural designs',
      japanese: 'Traditional Japanese tattoo art and imagery',
      blackwork: 'Bold black ink designs and patterns'
    };
    return descriptions[category] || `${category} style tattoo designs`;
  }

  private static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      traditional: '🌹',
      realistic: '👤',
      geometric: '🔷',
      watercolor: '🎨',
      minimalist: '✨',
      tribal: '🗿',
      japanese: '🌸',
      blackwork: '⚫'
    };
    return icons[category] || '🎯';
  }
}
