import { App, Popover } from "antd";
import { ArrowLeftRight, Check, ChevronRight, LogOut, Plus, Settings, UserPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useWorkspaceLogout } from "@/hooks/use-workspace-logout";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/use-user-store";

import { UserAvatar } from "./user-avatar";
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
    teams?: ProductAccountTeam[];
    activeTeamId?: string;
    onCreateTeam?: () => void;
    onInviteMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamMembers?: (team: ProductAccountTeam) => void;
    onOpenTeamCredits?: (team: ProductAccountTeam) => void;
    onSwitchAccount?: (teamId: string | null) => void;
};

const MOCK_TEAMS: ProductAccountTeam[] = [
    { id: "mock-team-owner", name: "测试团队", role: "owner" },
    { id: "mock-team-member", name: "创作小组", role: "member" },
];

export function ProductAccountMenu({
    triggerClassName,
    showCreateTeam = false,
    teams,
    activeTeamId,
    onCreateTeam,
    onInviteMembers,
    onOpenTeamMembers,
    onOpenTeamCredits,
    onSwitchAccount,
}: ProductAccountMenuProps) {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [open, setOpen] = useState(false);
    const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
    const [mockTeams, setMockTeams] = useState<ProductAccountTeam[]>([]);
    const [mockActiveTeamId, setMockActiveTeamId] = useState<string>();
    const { handleLogout, loggingOut } = useWorkspaceLogout("/email-login");
    const visibleTeams = teams ?? mockTeams;
    const visibleActiveTeamId = activeTeamId ?? mockActiveTeamId;
    const activeTeam = useMemo(
        () => visibleTeams.find((team) => team.id === visibleActiveTeamId),
        [visibleActiveTeamId, visibleTeams],
    );

    if (!user) return null;

    const name = user.displayName || user.username;
    const notifyUnavailable = () => message.info("团队功能即将开放");
    const closeAndRun = (action?: () => void) => {
        setOpen(false);
        setAccountSwitcherOpen(false);
        (action || notifyUnavailable)();
    };
    const createTeam = () => {
        if (onCreateTeam) {
            closeAndRun(onCreateTeam);
            return;
        }

        setMockTeams(MOCK_TEAMS);
        setMockActiveTeamId(MOCK_TEAMS[0].id);
    };
    const selectAccount = (teamId: string | null) => {
        if (onSwitchAccount) {
            onSwitchAccount(teamId);
        } else if (teams === undefined) {
            setMockActiveTeamId(teamId ?? undefined);
        } else {
            notifyUnavailable();
            return;
        }
        setAccountSwitcherOpen(false);
    };

    const accountSwitcher = (
        <section className="product-account-switcher" aria-label="切换账户">
            <div className="product-account-switcher__group">
                <div className="product-account-switcher__label">个人账户</div>
                <button
                    type="button"
                    className={cn("product-account-switcher__account", !activeTeam && "is-active")}
                    onClick={() => selectAccount(null)}
                >
                    <UserAvatar user={user} className="product-account-switcher__personal-avatar" fallbackVariant="product" />
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
            <button type="button" onClick={() => closeAndRun(onOpenTeamMembers ? () => onOpenTeamMembers(activeTeam) : undefined)}>成员管理</button>
            <button type="button" onClick={() => closeAndRun(onOpenTeamCredits ? () => onOpenTeamCredits(activeTeam) : () => navigate(`/team-settings/${encodeURIComponent(activeTeam.id)}/credits`, { state: { team: activeTeam } }))}>积分管理</button>
        </div>
    ) : null;

    const accountMenu = (
        <section className="product-account-menu" aria-label="账户菜单">
            <div className="product-account-menu__identity">
                <UserAvatar user={user} className="product-account-menu__avatar" fallbackVariant="product" />
                <span className="product-account-menu__identity-copy">
                    <strong>{name}</strong>
                    {activeTeam ? <span>团队：{activeTeam.name}</span> : null}
                </span>
                {activeTeam ? (
                    <Popover
                        trigger="click"
                        placement="leftTop"
                        arrow={false}
                        open={accountSwitcherOpen}
                        onOpenChange={setAccountSwitcherOpen}
                        rootClassName="product-account-switcher-popover"
                        content={accountSwitcher}
                    >
                        <button type="button" className="product-account-menu__identity-action">
                            <ArrowLeftRight aria-hidden="true" />
                            切换账户
                        </button>
                    </Popover>
                ) : showCreateTeam ? (
                    <button type="button" className="product-account-menu__identity-action" onClick={createTeam}>
                        <Plus aria-hidden="true" />
                        创建团队
                    </button>
                ) : null}
            </div>

            {activeTeam ? (
                <nav className="product-account-menu__actions" aria-label="团队与账户操作">
                    <Popover trigger="hover" placement="leftTop" arrow={false} rootClassName="product-team-settings-popover" content={teamSettings}>
                        <button type="button">
                            <Settings aria-hidden="true" />
                            <span>团队设置</span>
                            <ChevronRight className="product-account-menu__chevron" aria-hidden="true" />
                        </button>
                    </Popover>
                    <button type="button" onClick={() => closeAndRun(onInviteMembers ? () => onInviteMembers(activeTeam) : undefined)}>
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

    return (
        <Popover
            trigger="click"
            placement="bottomRight"
            arrow={false}
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) setAccountSwitcherOpen(false);
            }}
            rootClassName="product-account-menu-popover"
            content={accountMenu}
        >
            <button type="button" className={triggerClassName} aria-label="打开账户菜单" aria-expanded={open} title={name}>
                <UserAvatar user={user} className="size-full" fallbackVariant="product" />
            </button>
        </Popover>
    );
}

function LogoutButton({ loggingOut, onLogout }: { loggingOut: boolean; onLogout: () => void }) {
    return (
        <button type="button" disabled={loggingOut} onClick={onLogout}>
            <LogOut aria-hidden="true" />
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
