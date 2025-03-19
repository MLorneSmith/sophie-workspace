'use client';

import { useCallback, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { $createHeadingNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { FileText, LayoutTemplate, Lightbulb, RotateCcw } from 'lucide-react';

import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import {
  type BaseImprovement,
  type ImprovementType,
} from '@kit/ai-gateway/src/prompts/types/improvements';
import { type SimplifiedContent } from '@kit/ai-gateway/src/utils/parse-simplified';
import { Button } from '@kit/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { generateIdeasAction } from '../_actions/generate-ideas';
import { simplifyTextAction } from '../_actions/simplify-text';
import { type LexicalEditorRef } from './editor/lexical-editor';

interface ActionToolbarProps {
  editorRef: React.RefObject<LexicalEditorRef | null>;
  sectionType: ImprovementType;
  onGenerateImprovements?: (improvements: BaseImprovement[]) => void;
  onResetOutline?: () => Promise<void>;
  onImproveStructure?: () => Promise<void>;
}

export function ActionToolbar({
  editorRef,
  sectionType,
  onGenerateImprovements,
  onResetOutline,
  onImproveStructure,
}: ActionToolbarProps) {
  const [isSimplifying, setIsSimplifying] = useState(false);
  const { user } = useUserWorkspace();
  const searchParams = useSearchParams();
  const canvasId = searchParams.get('id');

  const handleSimplifyText = useCallback(async () => {
    if (!editorRef.current || !canvasId || !user) return;

    try {
      setIsSimplifying(true);

      // Get current editor content safely with try/catch
      let content = '';
      try {
        // Create a promise to get the content safely
        const getContentPromise = new Promise<string>((resolve) => {
          if (!editorRef.current) {
            resolve('');
            return;
          }

          try {
            editorRef.current.update(() => {
              try {
                const root = $getRoot();
                content = root.getTextContent();
                resolve(content);
              } catch (error) {
                console.warn('Error getting root text content:', error);
                resolve('');
              }
            });
          } catch (error) {
            console.warn('Error updating editor:', error);
            resolve('');
          }
        });

        // Wait for content with a timeout
        content = await Promise.race([
          getContentPromise,
          new Promise<string>((resolve) => setTimeout(() => resolve(''), 1000)),
        ]);

        // Call the simplify text action
        const result = await simplifyTextAction({
          content,
          userId: user.id,
          canvasId,
          sectionType,
        });

        if (result.success && result.response) {
          try {
            const simplified = JSON.parse(result.response) as SimplifiedContent;

            // Clear current content and insert simplified sections safely
            if (editorRef.current) {
              try {
                editorRef.current.update(() => {
                  try {
                    const root = $getRoot();
                    root.clear();

                    simplified.sections.forEach((section) => {
                      if (section.type === 'heading') {
                        const headingNode = $createHeadingNode('h2');
                        const textNode = $createTextNode(section.content);
                        headingNode.append(textNode);
                        root.append(headingNode);
                      } else {
                        const paragraphNode = $createParagraphNode();
                        const textNode = $createTextNode(
                          `• ${section.content}`,
                        );
                        paragraphNode.append(textNode);
                        root.append(paragraphNode);
                      }
                    });
                  } catch (innerError) {
                    console.warn('Error updating editor content:', innerError);
                  }
                });
              } catch (updateError) {
                console.warn('Error calling editor update:', updateError);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse simplified content:', parseError);
            return;
          }
        } else {
          console.error('Failed to simplify text:', result.error);
        }
      } catch (contentError) {
        console.warn('Error getting editor content:', contentError);
      }
    } catch (error) {
      console.error('Error simplifying text:', error);
    } finally {
      setIsSimplifying(false);
    }
  }, [editorRef, canvasId, user, sectionType]);

  const handleGenerateIdeas = useCallback(async () => {
    if (!editorRef.current || !canvasId || !user) return;

    try {
      // Get content safely with try/catch
      let content = '';
      try {
        // Create a promise to get the content safely
        const getContentPromise = new Promise<string>((resolve) => {
          if (!editorRef.current) {
            resolve('');
            return;
          }

          try {
            editorRef.current.update(() => {
              try {
                const root = $getRoot();
                content = root.getTextContent();
                resolve(content);
              } catch (error) {
                console.warn('Error getting root text content:', error);
                resolve('');
              }
            });
          } catch (error) {
            console.warn('Error updating editor:', error);
            resolve('');
          }
        });

        // Wait for content with a timeout
        content = await Promise.race([
          getContentPromise,
          new Promise<string>((resolve) => setTimeout(() => resolve(''), 1000)),
        ]);

        // Ensure content is not empty for the API call
        const contentToSend =
          content.trim() || 'Please suggest some initial ideas.';

        const result = await generateIdeasAction({
          content: contentToSend,
          submissionId: canvasId,
          type: sectionType,
        });

        if (
          result.success &&
          result.data?.improvements &&
          onGenerateImprovements
        ) {
          onGenerateImprovements(result.data.improvements);
        }
      } catch (contentError) {
        console.warn('Error getting editor content:', contentError);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    }
  }, [editorRef, canvasId, user, sectionType, onGenerateImprovements]);

  return (
    <div className="flex gap-2">
      {/* Reset Outline - Only for outline tab */}
      {sectionType === 'outline' && onResetOutline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onResetOutline}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Outline
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Regenerate outline from current situation, complication, and answer
          </TooltipContent>
        </Tooltip>
      )}

      {/* Simplify Text - For all tabs except outline */}
      {sectionType !== 'outline' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimplifyText}
              disabled={isSimplifying}
            >
              <FileText className="mr-2 h-4 w-4" />
              Simplify Text
            </Button>
          </TooltipTrigger>
          <TooltipContent>Make the text clearer and simpler</TooltipContent>
        </Tooltip>
      )}

      {/* Add Ideas - For all tabs except outline */}
      {sectionType !== 'outline' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleGenerateIdeas}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Add Ideas
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate additional ideas</TooltipContent>
        </Tooltip>
      )}

      {/* Improve Structure - Only for answer tab */}
      {sectionType === 'answer' && onImproveStructure && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onImproveStructure}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Improve Structure
            </Button>
          </TooltipTrigger>
          <TooltipContent>Enhance document structure</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
