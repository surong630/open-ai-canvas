import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";
import { getProductCurrentWorkspace, listProductWorkspaceAccounts, switchProductWorkspace, type ProductWorkspaceAccount } from "@/services/api/product-workspace";
import { setProductAccessToken } from "@/services/api/product-request";

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
    const [productAccount, setProductAccount] = useState<Pick<NonNullable<typeof user>, "id" | "username" | "displayName" | "avatarUrl" | "email"> & { workspaceId?: string; workspaceName?: string; workspaceType?: string; points?: number }>();
    const [productTeams, setProductTeams] = useState<ProductAccountTeam[]>([]);
    const [productAccountCount, setProductAccountCount] = useState(0);
    const [personalAccountId, setPersonalAccountId] = useState<string>();

    const applyProductAccount = (account: { userId?: number | string; id?: number | string; username?: string; displayName?: string; nickname?: string; name?: string; avatarUrl?: string; email?: string; workspaceId?: number | string; workspaceName?: string; points?: number }) => {
        if (!user) return;
        setProductAccount({
            id: String(account.userId ?? account.id ?? user.id),
            username: account.username || user.username,
            displayName: account.username || account.displayName || account.nickname || account.name || user.displayName,
            avatarUrl: account.avatarUrl || user.avatarUrl,
            email: account.email || user.email,
            workspaceId: String(account.workspaceId ?? account.id ?? ""),
            workspaceName: account.workspaceName,
            workspaceType: (account as { workspaceType?: string }).workspaceType,
            points: typeof account.points === "number" ? account.points : undefined,
        });
    };
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);
    const { availableMicrocredits } = useWalletBalance(user?.id, creditsEnabled && balanceText === undefined);
    const balance = balanceText ?? (typeof productAccount?.points === "number" ? productAccount.points.toLocaleString("zh-CN") : availableMicrocredits === null ? "--" : (availableMicrocredits / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 }));

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
                applyProductAccount(account);
            })
            .catch((error) => {
                if (!cancelled) console.warn("二开个人信息获取失败，继续使用旧用户信息", error);
            });
        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            setProductTeams([]);
            return;
        }
        let cancelled = false;
        void listProductWorkspaceAccounts()
            .then((accounts: ProductWorkspaceAccount[]) => {
                if (cancelled) return;
                setProductAccountCount(accounts.length);
                setPersonalAccountId(accounts.find((account) => (account.accountName || account.workspaceName || account.name) === "个人空间")?.accountId?.toString());
                setProductTeams(accounts.filter((account) => String(account.accountName || account.workspaceName || account.name || "") !== "个人空间" && String(account.workspaceType || "").toUpperCase() !== "PERSONAL").map((account) => ({
                    id: String(account.accountId ?? account.workspaceId ?? account.id ?? account.userId ?? ""),
                    name: account.accountName || account.workspaceName || account.name || account.username || "未命名团队",
                    avatarUrl: account.workspaceAvatarUrl || account.avatarUrl,
                    role: account.role === "member" ? "member" as const : "owner" as const,
                })).filter((team) => team.id));
            })
            .catch((error) => {
                if (!cancelled) {
                    setProductTeams([]);
                    console.warn("二开账户列表获取失败", error);
                }
            });
        return () => { cancelled = true; };
    }, [productAccount?.workspaceId, user]);

    const switchAccount = async (accountId: string | null) => {
        if (!accountId || !user) return;
        try {
            const session = await switchProductWorkspace(accountId);
            if (!session.token) throw new Error("切换账户未返回有效 token");
            setProductAccessToken(session);
            window.location.reload();
        } catch (error) {
            console.warn("二开账户切换失败", error);
        }
    };

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
                    <div className="product-page-header__account">
                        <ProductAccountMenu
                            triggerClassName="product-page-header__avatar"
                            showCreateTeam={showCreateTeam && productAccountCount <= 1}
                            canSwitchAccount={productAccountCount > 1}
                            activeTeamId={activeTeamId ?? (productAccountCount > 1 ? productAccount?.workspaceId : undefined)}
                            teams={teams ?? productTeams}
                            onCreateTeam={onCreateTeam}
                            onInviteMembers={onInviteMembers}
                            onOpenTeamMembers={onOpenTeamMembers}
                            onOpenTeamCredits={onOpenTeamCredits}
                            onSwitchAccount={onSwitchAccount || switchAccount}
                            personalAccountId={personalAccountId}
                            activeWorkspaceId={productAccount?.workspaceId}
                            accountOverride={productAccount}
                        />
                        {String(productAccount?.workspaceType || "").toUpperCase() === "TEAM" ? <span className="product-page-header__workspace-badge">团队版</span> : null}
                    </div>
                </>
            ) : (
                <button type="button" className="product-page-header__login" onClick={() => navigate("/email-login")}>注册/登录</button>
            )}
        </header>
    );
}
