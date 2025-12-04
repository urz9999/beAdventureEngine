import type { BoundingBox } from './BoundingBox';

export interface QuestionData {
  isRespondingToQuestion: boolean;
  correctAnswer: boolean;
  giveOkMessage: boolean;
  giveKomessage: boolean;
  giveTrigger: boolean;
  boundingBoxes: BoundingBox[];
  answeredQuestionNumber: number;
}
