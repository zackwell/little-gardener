import { Play, BookOpen, Settings, Flower2, Coins, Volume2, VolumeX } from "lucide-react";

interface MainMenuProps {
  onStartGame: () => void;
  onShowRecords: () => void;
  onShowNurture: () => void;
  onShowSettings: () => void;
  coins: number;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

export function MainMenu({
  onStartGame,
  onShowRecords,
  onShowNurture,
  onShowSettings,
  coins,
  musicEnabled,
  onToggleMusic,
}: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8">
      <div className="absolute top-8 right-8 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMusic}
          title={musicEnabled ? "关闭背景音乐" : "开启背景音乐"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:scale-105 hover:bg-white"
          aria-pressed={musicEnabled}
        >
          {musicEnabled ? (
            <Volume2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <VolumeX className="h-6 w-6 text-gray-500" />
          )}
        </button>
        <div className="flex items-center space-x-2 rounded-full bg-white/90 px-5 py-3 shadow-lg">
          <Coins className="h-6 w-6 text-yellow-500" />
          <span className="text-2xl text-yellow-600">{coins}</span>
        </div>
      </div>

      <div className="space-y-4 text-center">
        <div className="relative">
          <h1 className="mb-2 text-7xl text-white drop-shadow-lg">🌱</h1>
          <h1 className="text-6xl tracking-wider text-white drop-shadow-lg">小小园艺家</h1>
        </div>
        <p className="text-xl text-white/90 drop-shadow">框选数字，相加等于 10 即可消除</p>
      </div>

      <div className="flex w-80 flex-col space-y-4">
        <button
          type="button"
          onClick={onStartGame}
          className="group relative transform rounded-2xl bg-white px-8 py-4 text-purple-600 transition-all duration-300 hover:scale-105 hover:bg-yellow-300 hover:shadow-2xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <Play className="h-6 w-6" fill="currentColor" />
            <span className="text-2xl">开始游戏</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onShowNurture}
          className="transform rounded-2xl bg-white/90 px-8 py-3 text-green-600 transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <Flower2 className="h-5 w-5" />
            <span className="text-xl">我的花园</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onShowRecords}
          className="transform rounded-2xl bg-white/90 px-8 py-3 text-blue-600 transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <BookOpen className="h-5 w-5" />
            <span className="text-xl">记录</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onShowSettings}
          className="transform rounded-2xl bg-white/90 px-8 py-3 text-purple-600 transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <Settings className="h-5 w-5" />
            <span className="text-xl">设置</span>
          </div>
        </button>
      </div>

      <div className="absolute left-10 top-10 text-6xl opacity-20 animate-bounce">🌻</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-bounce delay-100">🌷</div>
      <div className="absolute right-20 top-1/4 text-5xl opacity-20 animate-pulse">🌸</div>
      <div className="absolute bottom-1/4 left-20 text-5xl opacity-20 animate-pulse delay-75">🌺</div>
    </div>
  );
}
