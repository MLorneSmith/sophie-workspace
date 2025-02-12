'use server';

import { submitCanvasAction, type SubmitFormData } from './submitCanvasAction';
import { setCanvasIdCookie } from './canvasAction';

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
