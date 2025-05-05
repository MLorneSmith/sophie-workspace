import { callPayloadAPI } from './packages/cms/payload/src/api/payload-api';

const questionIds = [
  '96a070a1-b8d8-47af-948d-f154567e892b',
  '6671dd8d-26e3-4215-95bf-0041c039afcf',
  '49c92ab4-f385-481f-8d0f-6af6400458bc',
];

async function fetchAndLogQuestions() {
  console.log('Fetching affected quiz questions...');
  for (const id of questionIds) {
    try {
      console.log(`Fetching question with ID: ${id}`);
      const questionData = await callPayloadAPI(`quiz_questions/${id}`);
      console.log(
        `Data for question ${id}:`,
        JSON.stringify(questionData, null, 2),
      );
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
    }
  }
  console.log('Finished fetching affected quiz questions.');
}

fetchAndLogQuestions();
