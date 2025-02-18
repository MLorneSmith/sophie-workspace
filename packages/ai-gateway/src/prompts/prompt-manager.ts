import { z } from 'zod';

import { type Role } from '../index';

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
   * Loads a prompt template
   * @param name Template name to load
   * @returns Array of chat messages with system and user roles
   */
  static loadTemplate(name: string): { role: Role; content: string }[] {
    if (this.templateCache[name]) {
      return JSON.parse(this.templateCache[name]);
    }

    const template = require(`./templates/${name}`).default;
    this.templateCache[name] = JSON.stringify(template);
    return template;
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
