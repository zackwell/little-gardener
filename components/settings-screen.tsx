import { Home } from "lucide-react";
import type { Difficulty, GameSettings } from "../game-settings-storage";
import { roundSecondsForDifficulty } from "../game-settings-storage";
import { useGameSettings } from "../settings-context";

interface SettingsScreenProps {
  onBackToMenu: () => void;
}

function difficultyLabel(d: Difficulty): string {
  switch (d) {
    case "easy":
      return "简单（6 分钟）";
    case "normal":
      return "一般（4 分钟）";
    case "hard":
      return "困难（2 分钟）";
    default:
      return d;
  }
}

export function SettingsScreen({ onBackToMenu }: SettingsScreenProps) {
  const { settings, setSettings } = useGameSettings();

  const patch = (partial: Partial<GameSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  return (
    <div className="panel-90 flex min-h-0 w-full max-w-lg flex-col rounded-3xl bg-white/95 p-6 shadow-2xl">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBackToMenu}
          className="rounded-xl bg-green-500 p-3 text-white transition-all hover:bg-green-600"
        >
          <Home className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-emerald-800">设置</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">难度</h2>
          <p className="mb-3 text-sm text-gray-500">单局限时；默认困难。</p>
          <div className="flex flex-col gap-2">
            {(["easy", "normal", "hard"] as const).map((d) => (
              <label
                key={d}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                  settings.difficulty === d ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  checked={settings.difficulty === d}
                  onChange={() => patch({ difficulty: d })}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="font-medium text-gray-800">{difficultyLabel(d)}</span>
                <span className="ml-auto text-sm text-gray-400">{roundSecondsForDifficulty(d)} 秒</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">音频</h2>
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-gray-800">背景音乐</span>
              <input
                type="checkbox"
                checked={settings.musicEnabled}
                onChange={(e) => patch({ musicEnabled: e.target.checked })}
                className="h-5 w-5 accent-emerald-600"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-gray-800">音效</span>
              <input
                type="checkbox"
                checked={settings.sfxEnabled}
                onChange={(e) => patch({ sfxEnabled: e.target.checked })}
                className="h-5 w-5 accent-emerald-600"
              />
            </label>
            <div>
              <div className="mb-2 flex justify-between text-sm text-gray-700">
                <span>主音量</span>
                <span className="tabular-nums">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.volume * 100)}
                onChange={(e) => patch({ volume: Number(e.target.value) / 100 })}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
