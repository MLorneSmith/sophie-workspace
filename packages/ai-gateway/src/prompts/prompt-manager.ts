export class PromptManager {
  static compile(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce((result, [key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      return result.replace(pattern, value);
    }, template);
  }
}
