import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";
import { getProductCurrentWorkspace } from "@/services/api/product-workspace";

import { ProductAccountMenu, type ProductAccountTeam } from "./product-account-menu";
import "./product-page-header.css";

type ProductPageHeaderProps = {
    className?: string;
    balanceText?: string;
    showCreateTeam?: boolean;
    teams?: ProductAccountTeam[];
    activeTeamId?: string;
    onCreateTeam?: () => void;
    onInviteMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamCredits?: (team: ProductAccountTeam) => void;
    onSwitchAccount?: (teamId: string | null) => void;
};

export function ProductPageHeader({
    className,
    balanceText,
    showCreateTeam = true,
    teams,
    activeTeamId,
    onCreateTeam,
    onInviteMembers,
    onOpenTeamMembers,
    onOpenTeamCredits,
    onSwitchAccount,
}: ProductPageHeaderProps) {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [productAccount, setProductAccount] = useState<Pick<NonNullable<typeof user>, "id" | "username" | "displayName" | "avatarUrl" | "email">>();
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);
    const { availableMicrocredits } = useWalletBalance(user?.id, creditsEnabled && balanceText === undefined);
    const balance = balanceText ?? (availableMicrocredits === null ? "--" : (availableMicrocredits / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 }));

    useEffect(() => {
        if (!user) {
            setProductAccount(undefined);
            return;
        }
        let cancelled = false;
        void getProductCurrentWorkspace()
            .then((payload) => {
                if (cancelled) return;
                const account = payload.user || payload.account || payload;
                setProductAccount({
                    id: String(account.userId ?? account.id ?? user.id),
                    username: account.username || user.username,
                    displayName: account.displayName || account.nickname || account.name || user.displayName,
                    avatarUrl: account.avatarUrl || user.avatarUrl,
                    email: account.email || user.email,
                });
            })
            .catch((error) => {
                if (!cancelled) console.warn("二开个人信息获取失败，继续使用旧用户信息", error);
            });
        return () => {
            cancelled = true;
        };
    }, [user]);

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
                    <ProductAccountMenu
                        triggerClassName="product-page-header__avatar"
                        showCreateTeam={showCreateTeam}
                        teams={teams}
                        activeTeamId={activeTeamId}
                        onCreateTeam={onCreateTeam}
                        onInviteMembers={onInviteMembers}
                        onOpenTeamMembers={onOpenTeamMembers}
                        onOpenTeamCredits={onOpenTeamCredits}
                        onSwitchAccount={onSwitchAccount}
                        accountOverride={productAccount}
                    />
                </>
            ) : (
                <button type="button" className="product-page-header__login" onClick={() => navigate("/email-login")}>注册/登录</button>
            )}
        </header>
    );
}
