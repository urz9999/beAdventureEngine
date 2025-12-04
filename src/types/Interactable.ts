import type { Question } from './Question';
import type { Dialog } from './Dialog';

export interface Interactable {
  type: string;
  linked: string;
  x: number;
  y: number;
  width: number;
  height: number;
  question?: Question;
  messages?: Dialog[];
  description?: string;
  usable?: boolean;
  interactable?: any;
  messageIndex?: number;
  trigger?: string | number;
  conditions?: any[];
  sound?: string;
  effect?: any;
  result?: any[];
  completedMessages?: Dialog[];
  notMetMessages?: Dialog[];
  doneMessages?: Dialog[];
  goodAnswerMessages?: Dialog[];
  wrongAnswerMessages?: Dialog[];
  retryMessages?: Dialog[];
  partner?: string;
  alternate?: boolean;
  goTo?: number;
  spawn?: [number, number];
  game?: string;
  url?: string;
  completed?: boolean;
}
