import { Trophy, Star, Home, ChevronRight, Coins, Timer } from "lucide-react";

interface VictoryModalProps {
  score: number;
  reward: number;
  /** 本局从开局到清盘用掉的秒数 */
  secondsUsed: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function VictoryModal({ score, reward, secondsUsed, onPlayAgain, onBackToMenu }: VictoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md transform rounded-3xl bg-white p-8 shadow-2xl animate-[scale-in_0.3s_ease-out]">
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <Trophy className="mx-auto h-24 w-24 animate-bounce text-yellow-500" />
            <div className="absolute -right-2 -top-2">
              <Star className="h-12 w-12 animate-spin text-yellow-400" style={{ animationDuration: "3s" }} />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Star className="h-10 w-10 animate-pulse text-yellow-400" />
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-center text-4xl text-green-600">恭喜清盘！</h2>
        <p className="mb-6 text-center text-green-400">每一局都是全新的随机盘面 🎉</p>

        <div className="mb-4 space-y-3 rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 p-6">
          <div className="flex items-center justify-between">
            <span className="text-green-600">本局得分</span>
            <span className="text-3xl text-green-700">{score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-green-600">
              <Timer className="h-4 w-4" />
              用时
            </span>
            <span className="text-3xl tabular-nums text-green-700">{secondsUsed} 秒</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-600">星级评价</span>
            <div className="flex space-x-1">
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 p-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-6 w-6 text-yellow-600" />
            <span className="text-purple-600">金币奖励（越快越多）</span>
          </div>
          <span className="text-3xl text-yellow-600">+{reward}</span>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex w-full transform items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white transition-all duration-300 hover:scale-105 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg"
          >
            <span className="text-xl">再玩一局</span>
            <ChevronRight className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="flex w-full transform items-center justify-center space-x-2 rounded-xl border-2 border-green-300 bg-white px-6 py-3 text-green-600 transition-all duration-300 hover:scale-105 hover:bg-gray-100"
          >
            <Home className="h-5 w-5" />
            <span className="text-lg">返回主菜单</span>
          </button>
        </div>

        <div className="absolute left-4 top-4 text-4xl opacity-50 animate-pulse">🌻</div>
        <div className="absolute right-4 top-4 text-4xl opacity-50 animate-pulse delay-75">🌷</div>
        <div className="absolute bottom-20 left-8 text-3xl opacity-30 animate-bounce">🌸</div>
        <div className="absolute bottom-20 right-8 text-3xl opacity-30 animate-bounce delay-100">🌺</div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
