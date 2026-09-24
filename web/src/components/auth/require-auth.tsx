import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { FullScreenLoader } from "@/components/ui/aceternity/full-screen-loader";
import { useUserStore } from "@/stores/use-user-store";

export function RequireAuth({ children, loginPath = "/login" }: { children: ReactNode; loginPath?: string }) {
    const location = useLocation();
    const hydrated = useUserStore((state) => state.hydrated);
    const user = useUserStore((state) => state.user);

    if (!hydrated) return <FullScreenLoader />;
    if (!user) return <Navigate to={`${loginPath}?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    return children;
}
