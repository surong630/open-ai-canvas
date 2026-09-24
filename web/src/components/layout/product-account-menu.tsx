import { Button, Popover } from "antd";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { useWorkspaceLogout } from "@/hooks/use-workspace-logout";
import { useUserStore } from "@/stores/use-user-store";

import { UserAvatar } from "./user-avatar";
import "./product-account-menu.css";

export function ProductAccountMenu({ triggerClassName }: { triggerClassName: string }) {
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
                        <UserAvatar user={user} className="product-account-menu__avatar" />
                        <strong>{name}</strong>
                    </div>
                    <Button
                        type="text"
                        icon={<LogOut />}
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
                <UserAvatar user={user} className="size-full" />
            </button>
        </Popover>
    );
}
