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

/** 收获结算弹窗：展示本次获得的果实与藏品 */
export interface HarvestRewardPayload {
  fruits: Array<{ id: string; name: string; count: number }>;
  collectibles: Array<{ id: string; name: string; count: number }>;
}
