export interface VictoryPayload {
  secondsUsed: number;
  roundSeconds: number;
  /** 本局结算总分（最后一次消除已计入） */
  finalScore: number;
}
