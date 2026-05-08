import { BookOpen, Coins, Flower2, Play, Settings, Volume2, VolumeX } from "lucide-react";
import buttonBgUrl from "../pics/button.png";
import logoUrl from "../pics/logo.png";
import mainMenuBgUrl from "../pics/main-menu.png";

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
  /** 底图用 img + contain，避免 background 拉伸裁切；勿加 overflow-hidden，否则藤蔓边缘会被切掉 */
  const menuButtonClass =
    "relative isolate flex h-[6.25rem] w-full cursor-pointer items-center justify-center gap-3 rounded-3xl border-0 bg-transparent px-10 py-0 shadow-none outline-none transition-[transform,filter] hover:scale-[1.02] hover:brightness-[1.03] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:h-[6.75rem]";

  const menuButtonBgClass =
    "pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none object-contain object-center [max-height:min(118%,7.75rem)] w-[min(104%,26rem)] sm:[max-height:min(118%,8.25rem)] sm:w-[min(104%,28rem)]";

  const menuLabelClass =
    "font-black tracking-wide text-neutral-950 [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff,0_0_10px_rgba(255,255,255,0.95),0_3px_12px_rgba(255,255,255,0.65)]";

  /** 左侧藤蔓略左移；纵向只做很小的上移，避免整体显得「顶在上面」 */
  const menuButtonLabelRow =
    "relative z-10 flex -translate-x-[0.55rem] -translate-y-0.5 items-center justify-center gap-3 sm:-translate-x-[0.75rem] sm:-translate-y-1";

  const menuButtonTextClass = `text-xl leading-tight ${menuLabelClass}`;

  return (
    <div
      className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto bg-cover bg-center p-8"
      style={{ backgroundImage: `url(${mainMenuBgUrl})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/12" aria-hidden />
      <div className="absolute top-8 right-8 z-20 flex items-center gap-2">
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

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center space-y-10">
        <img
          src={logoUrl}
          alt="小小园艺家"
          className="mx-auto w-[min(96vw,42rem)] max-h-[min(52vh,26rem)] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          draggable={false}
        />

        <div className="flex w-full max-w-sm flex-col gap-3 px-1 sm:max-w-md sm:gap-4">
          <button type="button" onClick={onStartGame} className={menuButtonClass}>
            <img src={buttonBgUrl} alt="" aria-hidden className={menuButtonBgClass} draggable={false} />
            <span className={menuButtonLabelRow}>
              <Play className={`h-6 w-6 shrink-0 ${menuLabelClass}`} strokeWidth={2.75} aria-hidden />
              <span className={menuButtonTextClass}>开始游戏</span>
            </span>
          </button>

          <button type="button" onClick={onShowNurture} className={menuButtonClass}>
            <img src={buttonBgUrl} alt="" aria-hidden className={menuButtonBgClass} draggable={false} />
            <span className={menuButtonLabelRow}>
              <Flower2 className={`h-6 w-6 shrink-0 ${menuLabelClass}`} strokeWidth={2.5} aria-hidden />
              <span className={menuButtonTextClass}>我的花园</span>
            </span>
          </button>

          <button type="button" onClick={onShowRecords} className={menuButtonClass}>
            <img src={buttonBgUrl} alt="" aria-hidden className={menuButtonBgClass} draggable={false} />
            <span className={menuButtonLabelRow}>
              <BookOpen className={`h-6 w-6 shrink-0 ${menuLabelClass}`} strokeWidth={2.5} aria-hidden />
              <span className={menuButtonTextClass}>记录</span>
            </span>
          </button>

          <button type="button" onClick={onShowSettings} className={menuButtonClass}>
            <img src={buttonBgUrl} alt="" aria-hidden className={menuButtonBgClass} draggable={false} />
            <span className={menuButtonLabelRow}>
              <Settings className={`h-6 w-6 shrink-0 ${menuLabelClass}`} strokeWidth={2.5} aria-hidden />
              <span className={menuButtonTextClass}>设置</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
