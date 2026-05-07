import { Home, Trophy, Star, Target } from "lucide-react";

interface RecordsScreenProps {
  onBackToMenu: () => void;
}

export function RecordsScreen({ onBackToMenu }: RecordsScreenProps) {
  // 模拟记录数据
  const records = [
    { level: 10, score: 1250, stars: 3, date: "2026-05-06" },
    { level: 9, score: 1100, stars: 3, date: "2026-05-06" },
    { level: 8, score: 980, stars: 2, date: "2026-05-05" },
    { level: 7, score: 850, stars: 3, date: "2026-05-05" },
    { level: 6, score: 720, stars: 2, date: "2026-05-04" },
  ];

  const stats = {
    totalGames: 45,
    highestLevel: 10,
    totalScore: 15680,
    totalStars: 112,
  };

  return (
    <div className="w-full max-w-2xl h-[90vh] bg-white/95 rounded-3xl shadow-2xl p-6 flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToMenu}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110"
        >
          <Home className="w-5 h-5" />
        </button>
        <h2 className="text-3xl text-purple-600">游戏记录</h2>
        <div className="w-14"></div>
      </div>

      {/* 统计数据卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl text-purple-700">{stats.totalGames}</div>
          <div className="text-sm text-purple-600">总游戏次数</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl text-yellow-700">{stats.highestLevel}</div>
          <div className="text-sm text-yellow-600">最高关卡</div>
        </div>

        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-pink-600" />
          </div>
          <div className="text-3xl text-pink-700">{stats.totalStars}</div>
          <div className="text-sm text-pink-600">总星星数</div>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 text-center">
          <div className="text-4xl mb-1">🎯</div>
          <div className="text-3xl text-blue-700">{stats.totalScore}</div>
          <div className="text-sm text-blue-600">总分数</div>
        </div>
      </div>

      {/* 最近记录列表 */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-xl text-purple-600 mb-3 flex items-center">
          <span>最近记录</span>
        </h3>
        <div className="space-y-3">
          {records.map((record, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center">
                  <span className="text-lg">#{record.level}</span>
                </div>
                <div>
                  <div className="text-purple-700">关卡 {record.level}</div>
                  <div className="text-sm text-purple-500">{record.date}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl text-purple-700">{record.score}</div>
                <div className="flex space-x-1 justify-end">
                  {Array.from({ length: record.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="mt-4 text-center text-purple-400 text-sm">
        继续努力，创造更好的记录！✨
      </div>
    </div>
  );
}
