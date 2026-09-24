import { App, Button, Popover } from "antd";
import { Plus } from "lucide-react";
import { useState } from "react";

import logoutIcon from "@/assets/product-home/icon_back@2x.png";
import { useWorkspaceLogout } from "@/hooks/use-workspace-logout";
import { useUserStore } from "@/stores/use-user-store";

import { UserAvatar } from "./user-avatar";
import "./product-account-menu.css";

export function ProductAccountMenu({ triggerClassName, showCreateTeam = false }: { triggerClassName: string; showCreateTeam?: boolean }) {
    const { message } = App.useApp();
    const user = useUserStore((state) => state.user);
    const [open, setOpen] = useState(false);
    const { handleLogout, loggingOut } = useWorkspaceLogout("/email-login");

    if (!user) return null;

    const name = user.displayName || user.username;
    return (
        <Popover
            trigger="click"
            placement="bottomRight"
            arrow={false}
            open={open}
            onOpenChange={setOpen}
            rootClassName="product-account-menu-popover"
            content={(
                <section className="product-account-menu" aria-label="账户菜单">
                    <div className="product-account-menu__identity">
                        <UserAvatar user={user} className="product-account-menu__avatar" fallbackVariant="product" />
                        <strong>{name}</strong>
                        {showCreateTeam ? <Button type="text" className="product-account-menu__team" icon={<Plus />} onClick={() => message.info("团队功能即将开放")}>创建团队</Button> : null}
                    </div>
                    <Button
                        type="text"
                        icon={<img className="product-account-menu__logout-icon" src={logoutIcon} alt="" />}
                        loading={loggingOut}
                        onClick={() => void handleLogout()}
                    >
                        退出登录
                    </Button>
                </section>
            )}
        >
            <button
                type="button"
                className={triggerClassName}
                aria-label="打开账户菜单"
                aria-expanded={open}
                title={name}
            >
                <UserAvatar user={user} className="size-full" fallbackVariant="product" />
            </button>
        </Popover>
    );
}
