import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "light" | "dark";

type ThemeStore = {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
};

const VALID_THEMES: ThemeName[] = ["light", "dark"];
const DEFAULT_THEME: ThemeName = "dark";

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: DEFAULT_THEME,
            // 写入前校验：非法 theme 直接忽略，防止 syncRemoteUserData 等路径绕过 merge 写入坏值
            setTheme: (next) => set((state) => (VALID_THEMES.includes(next) ? { theme: next } : state)),
        }),
        {
            name: "infinite-canvas:theme_store",
            // 产品当前固定以深色主题启动。保留运行时切换能力，但刷新或重新进入时
            // 不再让旧的浅色持久化值覆盖启动主题。
            merge: (_persisted, current) => ({ ...current, theme: DEFAULT_THEME }),
        },
    ),
);
