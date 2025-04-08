/**
 * Type definitions for Lexical JSON structure
 *
 * This file provides TypeScript interfaces for the Lexical JSON structure
 * used in the content migration system.
 */

/**
 * Interface for the Lexical JSON structure
 */
export interface LexicalJSON {
  root: {
    children: Array<{
      children: Array<{
        detail: number;
        format: number;
        mode: string;
        style: string;
        text: string;
        type: string;
        version: number;
      }>;
      direction: string;
      format: string;
      indent: number;
      type: string;
      version: number;
    }>;
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}
