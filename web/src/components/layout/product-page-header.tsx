import { Zap } from "lucide-react";
import { useNavigate } from "react-router";

import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";

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
                    />
                </>
            ) : (
                <button type="button" className="product-page-header__login" onClick={() => navigate("/email-login")}>注册/登录</button>
            )}
        </header>
    );
}
