// Placeholder for Lexical JSON type definition

export interface LexicalJSON {
  // Define the structure of Lexical JSON as needed
  // This is a basic example, expand based on actual Lexical output
  root: {
    type: string;
    children: any[]; // More specific types can be added later
    direction?: string;
    format?: string;
    indent?: number;
    version: number;
  };
}
