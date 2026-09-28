import { Zap } from "lucide-react";
import { useNavigate } from "react-router";

import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";

import { ProductAccountMenu } from "./product-account-menu";
import "./product-page-header.css";

export function ProductPageHeader({ className, balanceText, showCreateTeam = true }: {
    className?: string;
    balanceText?: string;
    showCreateTeam?: boolean;
}) {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);
    const { availableMicrocredits } = useWalletBalance(user?.id, creditsEnabled && balanceText === undefined);
    const balance = balanceText ?? (availableMicrocredits === null ? "--" : (availableMicrocredits / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 }));

    return (
        <header className={cn("product-page-header", className)}>
            {user ? (
                <>
                    {creditsEnabled ? (
                        <button type="button" className="product-page-header__credits" onClick={() => navigate("/credits")}>
                            <Zap aria-hidden="true" />
                            <span>{balance}</span>
                        </button>
                    ) : null}
                    <ProductAccountMenu triggerClassName="product-page-header__avatar" showCreateTeam={showCreateTeam} />
                </>
            ) : (
                <button type="button" className="product-page-header__login" onClick={() => navigate("/email-login")}>注册/登录</button>
            )}
        </header>
    );
}
