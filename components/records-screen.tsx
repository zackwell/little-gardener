import { useMemo } from "react";
import { Home, Trophy, Timer, Medal } from "lucide-react";
import { labelForRoundLimit } from "../game-settings-storage";
import { formatSecondsUsed, getBestVictoryRecords, type VictoryRecord } from "../records-storage";

interface RecordsScreenProps {
  onBackToMenu: () => void;
}

function rankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return "from-amber-100 to-yellow-100 ring-2 ring-amber-300";
    case 2:
      return "from-slate-100 to-slate-200 ring-2 ring-slate-300";
    case 3:
      return "from-orange-50 to-amber-100 ring-2 ring-orange-200";
    default:
      return "from-purple-50 to-pink-50";
  }
}

function medalEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return String(rank);
  }
}

function formatLocalDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RecordsScreen({ onBackToMenu }: RecordsScreenProps) {
  const records = useMemo(() => getBestVictoryRecords(), []);

  const bestEver = records[0]?.secondsUsed ?? null;

  return (
    <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white/95 p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToMenu}
          className="rounded-xl bg-purple-500 p-3 text-white transition-all duration-300 hover:scale-110 hover:bg-purple-600"
        >
          <Home className="h-5 w-5" />
        </button>
        <h2 className="text-3xl text-purple-600">通关榜</h2>
        <div className="w-14" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-4 text-center">
          <div className="mb-2 flex justify-center">
            <Timer className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {bestEver !== null ? formatSecondsUsed(bestEver) : "—"}
          </div>
          <div className="text-sm text-emerald-700">历史最佳用时</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 p-4 text-center">
          <div className="mb-2 flex justify-center">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">{records.length}</div>
          <div className="text-sm text-purple-700">榜单记录数（最多 5 条）</div>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-purple-700">
        <Medal className="h-5 w-5" />
        <span>最快五次排行</span>
      </div>
      <p className="mb-4 text-sm text-gray-500">按通关用时从短到长；若不足五条则显示已有条数。</p>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {records.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 py-16 text-center text-purple-400">
            还没有通关记录，去清一盘吧～
          </div>
        ) : (
          records.map((record: VictoryRecord, index: number) => {
            const rank = index + 1;
            return (
              <div
                key={`${record.at}-${index}`}
                className={`flex items-center justify-between rounded-xl bg-gradient-to-r p-4 shadow-sm transition-shadow hover:shadow-md ${rankStyle(rank)}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl shadow">
                    {medalEmoji(rank)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">
                      第 {rank} 名 · {labelForRoundLimit(record.roundSeconds)}
                    </div>
                    <div className="text-sm text-gray-500">{formatLocalDate(record.at)}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xl font-bold tabular-nums text-purple-800">
                    {formatSecondsUsed(record.secondsUsed)}
                  </div>
                  <div className="text-sm text-gray-600">得分 {record.score}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 text-center text-sm text-purple-400">用时越短排名越靠前 ✨</div>
    </div>
  );
}
