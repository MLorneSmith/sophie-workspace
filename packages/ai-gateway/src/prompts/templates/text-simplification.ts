import { type ChatMessage } from '../..';
import { textSimplifierSystem } from '../messages/system/text-simplifier';
import { simplifyRequestUser } from '../messages/user/simplify-request';

export const textSimplificationTemplate: ChatMessage[] = [
  { role: 'system', content: textSimplifierSystem },
  { role: 'user', content: simplifyRequestUser },
];

export type SimplifyTextVariables = {
  content: string;
};
