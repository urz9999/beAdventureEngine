export interface PlayerData {
  direction: number | boolean;
  animation: string;
  reachX?: number;
  clickedX?: number;
  noplayer: boolean;
  initialOffsetX: number;
  cam: number;
}
