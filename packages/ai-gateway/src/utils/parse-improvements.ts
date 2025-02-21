/**
 * Utility for parsing AI responses into standardized improvement objects
 */
import {
  BaseImprovement,
  ImprovementType,
} from '../prompts/types/improvements';

interface RawImprovement {
  improvementHeadline?: string;
  headline?: string;
  improvementDescription?: string;
  rationale?: string;
  implementedSummaryPoint?: string;
  summaryPoint?: string;
  implementedSupportingPoints?: string[];
  supportingPoints?: string[];
}

/**
 * Extracts JSON from a string that might contain additional text
 */
function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return match ? match[0] : null;
}

/**
 * Parses text format into improvement objects
 */
function parseTextFormat(text: string): RawImprovement[] {
  const improvements: RawImprovement[] = [];
  const improvementRegex =
    /Improvement \d+:\s*Headline: (.*?)\s*Rationale: (.*?)\s*Summary Point: (.*?)\s*Supporting Points:(.*?)(?=Improvement|\s*$)/g;
  const bulletPointRegex = /[-•]\s*(.*?)(?=[-•]|\s*$)/g;

  let match;
  while ((match = improvementRegex.exec(text)) !== null) {
    const [
      ,
      headline = '',
      rationale = '',
      summaryPoint = '',
      supportingPointsText = '',
    ] = match;

    const supportingPoints: string[] = [];
    let pointMatch;
    while (
      (pointMatch = bulletPointRegex.exec(supportingPointsText)) !== null
    ) {
      if (pointMatch[1]) {
        supportingPoints.push(pointMatch[1].trim());
      }
    }

    improvements.push({
      headline: headline.trim(),
      rationale: rationale.trim(),
      summaryPoint: summaryPoint.trim(),
      supportingPoints:
        supportingPoints.length > 0
          ? supportingPoints
          : supportingPointsText
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0),
    });
  }

  return improvements;
}

/**
 * Normalizes a raw improvement object into our standard format
 */
function normalizeImprovement(
  raw: RawImprovement,
  index: number,
): BaseImprovement {
  return {
    id: `imp_${index + 1}`,
    improvementHeadline: raw.improvementHeadline || raw.headline || '',
    improvementDescription: raw.improvementDescription || raw.rationale || '',
    implementedSummaryPoint:
      raw.implementedSummaryPoint || raw.summaryPoint || '',
    implementedSupportingPoints:
      raw.implementedSupportingPoints || raw.supportingPoints || [],
  };
}

/**
 * Parses an AI response into standardized improvement objects
 */
export function parseImprovements(
  response: string,
  type: ImprovementType,
): BaseImprovement[] {
  try {
    // First try to parse as JSON
    const jsonContent = extractJson(response);
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        const improvementsArray = Array.isArray(parsed)
          ? parsed
          : parsed.improvements || [];
        return improvementsArray.map((imp: RawImprovement, index: number) =>
          normalizeImprovement(imp, index),
        );
      } catch (jsonError) {
        console.error('Failed to parse JSON content:', jsonError);
        // Fall through to text parsing
      }
    }

    // If JSON parsing fails, try text format
    const textImprovements = parseTextFormat(response);
    return textImprovements.map((imp, index) =>
      normalizeImprovement(imp, index),
    );
  } catch (error) {
    console.error('Failed to parse improvements:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse AI response');
  }
}
