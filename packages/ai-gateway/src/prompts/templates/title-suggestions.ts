import { type ChatMessage } from '../../index';
import titleCreatorSystem from '../messages/system/title-creator';
import titleRequestUser from '../messages/user/title-request';

/**
 * Template for generating presentation title suggestions
 * Combines system and user messages with proper role structure
 */
const titleSuggestionsTemplate: ChatMessage[] = [
  {
    role: 'system',
    content: titleCreatorSystem,
  },
  {
    role: 'user',
    content: titleRequestUser,
  },
];

export default titleSuggestionsTemplate;
