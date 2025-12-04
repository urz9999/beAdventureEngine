import type { Answer } from './Answer';

export interface Question {
  name: string;
  text: string;
  answers: Answer[];
  result: any[];
}
