import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  HifeThemeMode,
  HifeThemePalette,
  getHifeTheme,
} from "@/constants/theme";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEME_STORAGE_KEY = "hife.theme.mode";

type HifeThemeContextValue = {
  mode: HifeThemeMode;
  palette: HifeThemePalette;
  ready: boolean;
  setMode: (mode: HifeThemeMode) => Promise<void>;
};

const HifeThemeContext = createContext<HifeThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is HifeThemeMode {
  return value === "warm" || value === "espresso";
}

export function HifeThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<HifeThemeMode>("warm");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (mounted && isThemeMode(savedMode)) {
          setModeState(savedMode);
        }
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: HifeThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      palette: getHifeTheme(mode),
      ready,
      setMode,
    }),
    [mode, ready, setMode]
  );

  return (
    <HifeThemeContext.Provider value={value}>
      {children}
    </HifeThemeContext.Provider>
  );
}

export function useHifeTheme() {
  const context = useContext(HifeThemeContext);

  if (!context) {
    throw new Error("useHifeTheme must be used within HifeThemeProvider");
  }

  return context;
}
