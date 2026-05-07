import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Difficulty,
  type GameSettings,
  loadSettings,
  roundSecondsForDifficulty,
  saveSettings,
} from "./game-settings-storage";
import { resumeAudioContext, setAudioOptions } from "./game-audio";

interface SettingsContextValue {
  settings: GameSettings;
  setSettings: (next: GameSettings | ((prev: GameSettings) => GameSettings)) => void;
  roundSeconds: number;
  toggleMusic: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<GameSettings>(() => loadSettings());

  const setSettings = useCallback((next: GameSettings | ((prev: GameSettings) => GameSettings)) => {
    setSettingsState((prev) => {
      const n = typeof next === "function" ? next(prev) : next;
      saveSettings(n);
      return n;
    });
  }, []);

  const roundSeconds = useMemo(() => roundSecondsForDifficulty(settings.difficulty), [settings.difficulty]);

  const toggleMusic = useCallback(() => {
    setSettings((s) => ({ ...s, musicEnabled: !s.musicEnabled }));
  }, [setSettings]);

  useEffect(() => {
    setAudioOptions({
      musicEnabled: settings.musicEnabled,
      sfxEnabled: settings.sfxEnabled,
      volume: settings.volume,
    });
  }, [settings.musicEnabled, settings.sfxEnabled, settings.volume]);

  useEffect(() => {
    const onFirstGesture = () => {
      resumeAudioContext();
    };
    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      roundSeconds,
      toggleMusic,
    }),
    [settings, setSettings, roundSeconds, toggleMusic],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useGameSettings(): SettingsContextValue {
  const v = useContext(SettingsContext);
  if (!v) throw new Error("useGameSettings must be used within SettingsProvider");
  return v;
}

export type { Difficulty, GameSettings };
export { roundSecondsForDifficulty, loadSettings };
