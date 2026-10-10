import { App, Popover } from "antd";
import { ArrowLeftRight, Check, ChevronRight, Plus, Settings, UserPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import logoutIcon from "@/assets/account/logout@2x.png";
import { useWorkspaceLogout } from "@/hooks/use-workspace-logout";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";
import { createProductTeam } from "@/services/api/product-workspace";
import type { LocalUser } from "@/stores/use-user-store";

import { UserAvatar } from "./user-avatar";
import { CreateTeamModal, type CreateTeamDraft } from "./create-team-modal";
import { InviteMembersModal } from "./invite-members-modal";
import "./product-account-menu.css";

export type ProductAccountTeam = {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "owner" | "member";
};

type ProductAccountMenuProps = {
    triggerClassName: string;
    showCreateTeam?: boolean;
    canSwitchAccount?: boolean;
    teams?: ProductAccountTeam[];
    activeTeamId?: string;
    onCreateTeam?: () => void;
    onInviteMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamCredits?: (team: ProductAccountTeam) => void;
    onSwitchAccount?: (teamId: string | null) => void;
    personalAccountId?: string;
    activeWorkspaceId?: string;
    accountOverride?: Pick<LocalUser, "id" | "username" | "displayName" | "avatarUrl" | "email"> & { workspaceName?: string; points?: number };
};

const MOCK_TEAMS: ProductAccountTeam[] = [
    { id: "mock-team-owner", name: "测试团队", role: "owner" },
    { id: "mock-team-member", name: "创作小组", role: "member" },
];

export function ProductAccountMenu({
    triggerClassName,
    showCreateTeam = false,
    canSwitchAccount = false,
    teams,
    activeTeamId,
    onCreateTeam,
    onInviteMembers,
    onOpenTeamMembers,
    onOpenTeamCredits,
    onSwitchAccount,
    personalAccountId,
    activeWorkspaceId,
    accountOverride,
}: ProductAccountMenuProps) {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const accountUser = user && accountOverride ? { ...user, ...accountOverride } : user;
    const [open, setOpen] = useState(false);
    const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
    const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
    const [mockTeams, setMockTeams] = useState<ProductAccountTeam[]>(MOCK_TEAMS);
    const [createdTeams, setCreatedTeams] = useState<ProductAccountTeam[]>([]);
    const [mockActiveTeamId, setMockActiveTeamId] = useState<string>();
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const [inviteTeam, setInviteTeam] = useState<ProductAccountTeam>();
    const { handleLogout, loggingOut } = useWorkspaceLogout("/email-login");
    const visibleTeams = [...(teams ?? mockTeams), ...createdTeams];
    const visibleActiveTeamId = activeTeamId ?? mockActiveTeamId;
    const activeTeam = useMemo(
        () => visibleTeams.find((team) => team.id === visibleActiveTeamId),
        [visibleActiveTeamId, visibleTeams],
    );

    if (!user || !accountUser) return null;

    const name = accountOverride?.username || accountUser.username || accountUser.displayName;
    const workspaceName = accountOverride?.workspaceName || "个人空间";
    const notifyUnavailable = () => message.info("团队功能即将开放");
    const closeAndRun = (action?: () => void) => {
        setOpen(false);
        setAccountSwitcherOpen(false);
        setTeamSettingsOpen(false);
        (action || notifyUnavailable)();
    };
    const createTeam = () => {
        if (onCreateTeam) {
            closeAndRun(onCreateTeam);
            return;
        }
        setOpen(false);
        setAccountSwitcherOpen(false);
        setTeamSettingsOpen(false);
        setCreateTeamOpen(true);
    };
    const confirmCreateTeam = async (draft: CreateTeamDraft) => {
        try {
            const created = await createProductTeam({ teamName: draft.name, teamAvatarUrl: draft.avatarUrl });
            const id = String(created.teamId ?? created.id ?? `product-team-${Date.now()}`);
            const team: ProductAccountTeam = { id, name: created.teamName || created.name || draft.name, avatarUrl: created.teamAvatarUrl || created.avatarUrl || draft.avatarUrl, role: created.role === "member" ? "member" : "owner" };
            if (teams === undefined) setMockTeams((current) => [...current, team]);
            else setCreatedTeams((current) => [...current, team]);
            setMockActiveTeamId(id);
            setCreateTeamOpen(false);
            message.success("团队创建成功");
        } catch (error) {
            message.error(error instanceof Error ? `团队创建失败：${error.message}` : "团队创建失败，请稍后重试");
        }
    };
    const inviteMembers = (team: ProductAccountTeam) => {
        if (onInviteMembers) {
            closeAndRun(() => onInviteMembers(team));
            return;
        }
        setOpen(false);
        setAccountSwitcherOpen(false);
        setTeamSettingsOpen(false);
        setInviteTeam(team);
    };
    const selectAccount = (teamId: string | null) => {
        const targetId = teamId ?? personalAccountId ?? null;
        if (targetId && activeWorkspaceId && targetId === activeWorkspaceId) {
            setAccountSwitcherOpen(false);
            return;
        }
        if (onSwitchAccount) {
            onSwitchAccount(targetId);
        } else if (teams === undefined) {
            setMockActiveTeamId(teamId ?? undefined);
        } else {
            notifyUnavailable();
            return;
        }
        setAccountSwitcherOpen(false);
        setTeamSettingsOpen(false);
    };

    const accountSwitcher = (
        <section className="product-account-switcher" aria-label="切换账户">
            <div className="product-account-switcher__group">
                <div className="product-account-switcher__label">个人账户</div>
                <button
                    type="button"
                    className={cn("product-account-switcher__account", "is-personal", !activeTeam && "is-active")}
                    onClick={() => selectAccount(null)}
                >
                    <UserAvatar user={accountUser} className="product-account-switcher__personal-avatar" fallbackVariant="product" />
                    <span className="product-account-switcher__account-name">{name}</span>
                    {!activeTeam ? <Check aria-hidden="true" /> : null}
                </button>
            </div>

            <div className="product-account-switcher__separator" />
            <div className="product-account-switcher__group">
                <div className="product-account-switcher__label">团队账户</div>
                {visibleTeams.length ? visibleTeams.map((team) => (
                    <button
                        key={team.id}
                        type="button"
                        className={cn("product-account-switcher__account", activeTeam?.id === team.id && "is-active")}
                        onClick={() => selectAccount(team.id)}
                    >
                        <TeamAvatar team={team} />
                        <span className="product-account-switcher__account-copy">
                            <span className="product-account-switcher__account-name">{team.name}</span>
                            <span className={cn("product-account-switcher__role", `is-${team.role}`)}>
                                {team.role === "owner" ? "团队负责人" : "团队成员"}
                            </span>
                        </span>
                        {activeTeam?.id === team.id ? <Check aria-hidden="true" /> : null}
                    </button>
                )) : <div className="product-account-switcher__empty">暂无团队</div>}
            </div>

            {showCreateTeam ? (
                <>
                    <div className="product-account-switcher__separator" />
                    <button type="button" className="product-account-switcher__create" onClick={createTeam}>
                        <Plus aria-hidden="true" />
                        创建团队
                    </button>
                </>
            ) : null}
        </section>
    );

    const teamSettings = activeTeam ? (
        <div className="product-team-settings" aria-label="团队设置">
            <button type="button" onClick={() => closeAndRun(onOpenTeamMembers ? () => onOpenTeamMembers(activeTeam) : () => navigate(`/team-settings/${encodeURIComponent(activeTeam.id)}/members`, { state: { team: activeTeam } }))}>成员管理</button>
            <button type="button" onClick={() => closeAndRun(onOpenTeamCredits ? () => onOpenTeamCredits(activeTeam) : () => navigate(`/team-settings/${encodeURIComponent(activeTeam.id)}/credits`, { state: { team: activeTeam } }))}>积分管理</button>
        </div>
    ) : null;

    const accountMenuContent = (
        <section className="product-account-menu" aria-label="账户菜单">
            <div className="product-account-menu__identity">
                                <UserAvatar user={accountUser} className="product-account-menu__avatar" fallbackVariant="product" />
                <span className="product-account-menu__identity-copy">
                    <strong>{name}</strong>
                    <span>{activeTeam ? `团队：${activeTeam.name}` : workspaceName}</span>
                </span>
                {activeTeam ? (
                    <button
                        type="button"
                        className="product-account-menu__identity-action"
                        onClick={() => {
                            setTeamSettingsOpen(false);
                            setAccountSwitcherOpen((value) => !value);
                        }}
                    >
                        <ArrowLeftRight aria-hidden="true" />
                        切换账户
                    </button>
                ) : canSwitchAccount ? (
                    <button type="button" className="product-account-menu__identity-action" onClick={() => setAccountSwitcherOpen((value) => !value)}>
                        <ArrowLeftRight aria-hidden="true" />
                        切换团队
                    </button>
                ) : showCreateTeam ? (
                    <button type="button" className="product-account-menu__identity-action" onClick={createTeam}>
                        <Plus aria-hidden="true" />
                        创建团队
                    </button>
                ) : null}
            </div>

            {activeTeam ? (
                <nav className="product-account-menu__actions" aria-label="团队与账户操作">
                    <button
                        type="button"
                        onClick={() => {
                            setAccountSwitcherOpen(false);
                            setTeamSettingsOpen((value) => !value);
                        }}
                    >
                        <Settings aria-hidden="true" />
                        <span>团队设置</span>
                        <ChevronRight className="product-account-menu__chevron" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => inviteMembers(activeTeam)}>
                        <UserPlus aria-hidden="true" />
                        <span>邀请成员</span>
                    </button>
                    <LogoutButton loggingOut={loggingOut} onLogout={() => void handleLogout()} />
                </nav>
            ) : (
                <nav className="product-account-menu__actions" aria-label="账户操作">
                    <LogoutButton loggingOut={loggingOut} onLogout={() => void handleLogout()} />
                </nav>
            )}
        </section>
    );

    const accountMenu = (
        <div className="product-account-menu-stack">
            {open && accountSwitcherOpen ? (
                <div className="product-account-switcher-layer">{accountSwitcher}</div>
            ) : null}
            {open && teamSettingsOpen ? (
                <div className="product-team-settings-layer">{teamSettings}</div>
            ) : null}
            {accountMenuContent}
        </div>
    );

    return (
        <>
        <Popover
            trigger="click"
            placement="bottomRight"
            arrow={false}
            open={open}
            destroyOnHidden
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                    setAccountSwitcherOpen(false);
                    setTeamSettingsOpen(false);
                }
            }}
            rootClassName="product-account-menu-popover"
            content={accountMenu}
        >
            <button type="button" className={triggerClassName} aria-label="打开账户菜单" aria-expanded={open} title={name}>
                            <UserAvatar user={accountUser} className="size-full" fallbackVariant="product" />
            </button>
        </Popover>
        <CreateTeamModal open={createTeamOpen} onCancel={() => setCreateTeamOpen(false)} onConfirm={confirmCreateTeam} />
        <InviteMembersModal team={inviteTeam} onClose={() => setInviteTeam(undefined)} />
        </>
    );
}

function LogoutButton({ loggingOut, onLogout }: { loggingOut: boolean; onLogout: () => void }) {
    return (
        <button type="button" disabled={loggingOut} onClick={onLogout}>
            <img src={logoutIcon} alt="" aria-hidden="true" />
            <span>{loggingOut ? "退出中" : "退出登录"}</span>
        </button>
    );
}

function TeamAvatar({ team }: { team: ProductAccountTeam }) {
    if (team.avatarUrl) return <img className="product-account-switcher__team-avatar" src={team.avatarUrl} alt="" />;

    return (
        <span className="product-account-switcher__team-avatar product-account-switcher__team-avatar--fallback" aria-hidden="true">
            <UsersRound />
        </span>
    );
}
