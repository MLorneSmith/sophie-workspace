/**
 * Types for the improvements system
 *
 * These types define the structure of improvements across all
 * sections of the SCQA framework.
 */

/**
 * Valid section types in the SCQA framework
 */
export type ImprovementType =
  | 'situation'
  | 'complication'
  | 'answer'
  | 'outline';

/**
 * Base improvement interface shared by all section types
 */
export interface BaseImprovement {
  id: string;
  improvementHeadline: string;
  improvementDescription: string;
  implementedSummaryPoint: string;
  implementedSupportingPoints: string[];
}

/**
 * Section-specific improvement types
 */
export interface SituationImprovement extends BaseImprovement {
  type: 'situation';
}

export interface ComplicationImprovement extends BaseImprovement {
  type: 'complication';
}

export interface AnswerImprovement extends BaseImprovement {
  type: 'answer';
}

export interface OutlineImprovement extends BaseImprovement {
  type: 'outline';
}

/**
 * Union type of all improvement types
 */
export type Improvement =
  | SituationImprovement
  | ComplicationImprovement
  | AnswerImprovement
  | OutlineImprovement;

/**
 * Input parameters for generating improvements
 */
export interface ImprovementsInput {
  content: string;
  submissionId: string;
  type: ImprovementType;
}

/**
 * Response structure for improvements
 */
export interface ImprovementsResponse {
  success: boolean;
  data?: {
    improvements: Improvement[];
  };
  error?: string;
}
