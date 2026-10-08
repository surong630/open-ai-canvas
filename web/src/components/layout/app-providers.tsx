import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useLayoutEffect,useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useReducedMotion } from "motion/react";

import { AuthSessionHydrator } from "@/components/auth/auth-session-hydrator";
import { FullScreenLoader } from "@/components/ui/aceternity/full-screen-loader";
import { getAntThemeConfig } from "@/lib/app-theme";
import { applySkinTheme } from "@/lib/skin-themes";
import { appQueryClient } from "@/lib/query-client";
import { isIsolatedPrevisRepro } from "@/lib/dev-repro";
import { useActiveTheme } from "@/stores/canvas/use-canvas-theme-store";
import { applyAppearanceMetadata, useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";
import { refreshPublicAppearance } from "@/services/appearance-bootstrap";

const ClientRootInit = lazy(() => import("@/components/layout/client-root-init").then((module) => ({ default: module.ClientRootInit })));

function ClientRootBoundary({ children }: { children: ReactNode }) {
    const authenticated = useUserStore((state) => Boolean(state.user));
    if (!authenticated) return children;
    return (
        <Suspense fallback={<FullScreenLoader label="正在准备创作环境" detail="连接本地能力与模型配置" />}>
            <ClientRootInit>{children}</ClientRootInit>
        </Suspense>
    );
}

export function AppProviders({ children }: { children: ReactNode }) {
    const theme = useActiveTheme();
    const dark = theme === "dark";
    const appearance = useAppearanceStore((state) => state.appearance);
    const reducedMotion = useReducedMotion();
    const antTheme = useMemo(() => {
        const config = getAntThemeConfig(dark, appearance.activeSkin);
        return {
            ...config,
            token: {
                ...config.token,
                // 让 AntD 自己跳过 rc-motion；用 CSS 把动画压到 1ms 会让
                // Select/Popover 的首次测量与结束回调竞态，弹层停在屏幕外。
                motion: !reducedMotion,
            },
        };
    }, [appearance.activeSkin, dark, reducedMotion]);

    useLayoutEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.style.colorScheme = theme;
        applySkinTheme(appearance.activeSkin, theme);
        applyAppearanceMetadata(appearance);
    }, [appearance, dark, theme]);

    // DEV 复现台必须是同源本地确定性场景：AuthSessionHydrator 会打 /api/auth/session，
    // ClientRootInit 会打 /api/model-catalog，没有后端时产生真实 502，与导演台无关却会污染判据。
    // 与启动入口共用精确路径边界；生产构建中 import.meta.env.DEV 为 false，始终不启用隔离。
    const isolateDevRepro = typeof window !== "undefined" && isIsolatedPrevisRepro(import.meta.env.DEV, window.location.pathname);

    useEffect(() => {
        if (isolateDevRepro) return;
        const refresh = () => {
            if (document.visibilityState === "visible") void refreshPublicAppearance();
        };
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [isolateDevRepro]);

    return (
        <ConfigProvider locale={zhCN} theme={antTheme} wave={{ disabled: true }}>
            <App message={{ duration: 3, maxCount: 3 }} notification={{ duration: 4.5, maxCount: 3, placement: "topRight" }}>
                <QueryClientProvider client={appQueryClient}>
                    {isolateDevRepro ? (
                        children
                    ) : (
                        <AuthSessionHydrator>
                            <ClientRootBoundary>{children}</ClientRootBoundary>
                        </AuthSessionHydrator>
                    )}
                </QueryClientProvider>
            </App>
        </ConfigProvider>
    );
}
