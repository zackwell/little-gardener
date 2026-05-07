import { Play, BookOpen, Settings, Flower2, Coins } from "lucide-react";

interface MainMenuProps {
  onStartGame: () => void;
  onShowRecords: () => void;
  onShowNurture: () => void;
  coins: number;
}

export function MainMenu({ onStartGame, onShowRecords, onShowNurture, coins }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8">
      {/* 金币显示 */}
      <div className="absolute top-8 right-8 bg-white/90 px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
        <Coins className="w-6 h-6 text-yellow-500" />
        <span className="text-2xl text-yellow-600">{coins}</span>
      </div>

      {/* 游戏标题 */}
      <div className="text-center space-y-4">
        <div className="relative">
          <h1 className="text-7xl text-white drop-shadow-lg mb-2">
            🌱
          </h1>
          <h1 className="text-6xl text-white drop-shadow-lg tracking-wider">
            小小园艺家
          </h1>
        </div>
        <p className="text-xl text-white/90 drop-shadow">
          框选数字，相加等于 10 即可消除
        </p>
      </div>

      {/* 菜单按钮 */}
      <div className="flex flex-col space-y-4 w-80">
        <button
          onClick={onStartGame}
          className="group relative bg-white hover:bg-yellow-300 text-purple-600 px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <Play className="w-6 h-6" fill="currentColor" />
            <span className="text-2xl">开始游戏</span>
          </div>
        </button>

        <button 
          onClick={onShowNurture}
          className="bg-white/90 hover:bg-white text-green-600 px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <Flower2 className="w-5 h-5" />
            <span className="text-xl">我的花园</span>
          </div>
        </button>

        <button 
          onClick={onShowRecords}
          className="bg-white/90 hover:bg-white text-blue-600 px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <BookOpen className="w-5 h-5" />
            <span className="text-xl">记录</span>
          </div>
        </button>

        <button className="bg-white/90 hover:bg-white text-purple-600 px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-center space-x-3">
            <Settings className="w-5 h-5" />
            <span className="text-xl">设置</span>
          </div>
        </button>
      </div>

      {/* 装饰元素 */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">
        🌻
      </div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-bounce delay-100">
        🌷
      </div>
      <div className="absolute top-1/4 right-20 text-5xl opacity-20 animate-pulse">
        🌸
      </div>
      <div className="absolute bottom-1/4 left-20 text-5xl opacity-20 animate-pulse delay-75">
        🌺
      </div>
    </div>
  );
}