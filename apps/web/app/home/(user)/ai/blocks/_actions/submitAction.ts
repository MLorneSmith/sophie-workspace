'use server';

import { setCanvasIdCookie } from './canvasAction';
import {
  type SubmitFormData,
  submitCanvasAction,
} from './submitBuildingBlocksAction';

export async function submitForm(data: SubmitFormData) {
  try {
    const result = await submitCanvasAction(data);
    if (result.success) {
      // Set the canvas ID cookie
      await setCanvasIdCookie(result.submissionId);
    }
    return result;
  } catch (error) {
    console.error('Error in submitForm:', error);
    throw error;
  }
}
