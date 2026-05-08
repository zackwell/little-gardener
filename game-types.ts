export interface VictoryPayload {
  secondsUsed: number;
  roundSeconds: number;
  /** 本局结算总分（最后一次消除已计入） */
  finalScore: number;
}

/** 时间耗尽失败时上报：用于计算安慰金币 */
export interface DefeatPayload {
  cellsRemaining: number;
  roundSeconds: number;
}
