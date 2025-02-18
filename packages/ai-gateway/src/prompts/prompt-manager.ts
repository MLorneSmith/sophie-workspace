import { z } from 'zod';

/**
 * Schema for prompt variables
 */
const PromptVariablesSchema = z.record(z.string());

/**
 * Type for prompt variables
 */
export type PromptVariables = z.infer<typeof PromptVariablesSchema>;

/**
 * Manages prompts and their compilation
 */
export class PromptManager {
  /**
   * Cache for loaded templates
   */
  private static templateCache: Record<string, string> = {};

  /**
   * Cache for loaded partials
   */
  private static partialsCache: Record<string, string> = {};

  /**
   * Loads a prompt template
   * @param name Template name to load
   * @returns Template content
   */
  static loadTemplate(name: string): string {
    if (this.templateCache[name]) {
      return this.templateCache[name];
    }

    const template = require(`./templates/${name}`).default;
    this.templateCache[name] = template;
    return template;
  }

  /**
   * Loads a prompt partial
   * @param name Partial name to load
   * @returns Partial content
   */
  static loadPartial(name: string): string {
    if (this.partialsCache[name]) {
      return this.partialsCache[name];
    }

    const partial = require(`./partials/${name}`).default;
    this.partialsCache[name] = partial;
    return partial;
  }

  /**
   * Compiles a prompt template with variables
   * @param template Template string
   * @param variables Variables to inject
   * @returns Compiled prompt
   */
  static compile(template: string, variables: PromptVariables): string {
    let result = template;

    // Replace variables using mustache-style syntax
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Merges partials into a template
   * @param template Template string
   * @param partials Array of partial names to merge
   * @returns Template with merged partials
   */
  static mergePartials(template: string, partials: string[]): string {
    let result = template;

    for (const partial of partials) {
      const partialContent = this.loadPartial(partial);
      const regex = new RegExp(`{{>\\s*${partial}\\s*}}`, 'g');
      result = result.replace(regex, partialContent);
    }

    return result;
  }

  /**
   * Validates that all required variables are provided
   * @param template Template string
   * @param variables Variables provided
   * @throws Error if required variables are missing
   */
  static validateVariables(template: string, variables: PromptVariables): void {
    const requiredVars =
      template
        .match(/{{(\s*[\w]+\s*)}}/g)
        ?.map((match) => match.replace(/[{}]/g, '').trim()) || [];

    const missingVars = requiredVars.filter(
      (variable) => !variables.hasOwnProperty(variable),
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }
  }
}
