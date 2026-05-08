import { XCircle, Home, RotateCcw, Coins } from "lucide-react";

interface DefeatModalProps {
  score: number;
  consolationGold: number;
  onRetry: () => void;
  onBackToMenu: () => void;
}

export function DefeatModal({ score, consolationGold, onRetry, onBackToMenu }: DefeatModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md transform rounded-3xl bg-white p-8 shadow-2xl animate-[scale-in_0.3s_ease-out]">
        {/* 失败图标 */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="text-8xl mb-4 animate-[shake_0.5s_ease-in-out]">
              😢
            </div>
            <XCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse absolute -top-2 -right-2" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-4xl text-center text-red-500 mb-2">
          挑战失败
        </h2>
        <p className="text-center text-gray-500 mb-6">
          💪 别气馁，再试一次吧！
        </p>

        {/* 得分信息 */}
        <div className="mb-4 space-y-3 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">本局得分</span>
            <span className="text-3xl text-gray-700">{score}</span>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            <span className="text-amber-900">安慰奖励</span>
          </div>
          <span className="text-2xl font-semibold text-amber-700">+{consolationGold}</span>
        </div>
        <p className="mb-6 text-center text-xs text-gray-500">
          进度越高、所选难度越高，安慰金币越多
        </p>

        {/* 鼓励语 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-blue-600">💡 提示：仔细观察数字组合</p>
          <p className="text-sm text-blue-500 mt-1">框选一片区域，使其中数字之和恰好为 10</p>
        </div>

        {/* 按钮组 */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-xl">重新挑战</span>
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full bg-white hover:bg-gray-100 text-gray-600 border-2 border-gray-300 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span className="text-lg">返回主菜单</span>
          </button>
        </div>

        {/* 装饰性元素 */}
        <div className="absolute top-4 left-4 text-4xl opacity-30 animate-pulse">
          💔
        </div>
        <div className="absolute top-4 right-4 text-4xl opacity-30 animate-pulse delay-75">
          😔
        </div>
        <div className="absolute bottom-20 left-8 text-3xl opacity-20">
          💧
        </div>
        <div className="absolute bottom-20 right-8 text-3xl opacity-20">
          💧
        </div>
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
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px) rotate(-5deg);
          }
          75% {
            transform: translateX(10px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}
