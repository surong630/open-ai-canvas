import { Dropdown, type MenuProps } from "antd";
import { MoreHorizontal } from "lucide-react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import "./product-card-more-menu.css";

const menuStyle = {
    "--popover": "#363636",
    "--popover-foreground": "#ffffff",
    "--workspace-overlay-bg-strong": "#363636",
    "--workspace-overlay-hover": "#4a4a4a",
    "--workspace-overlay-selected": "#4a4a4a",
    "--r-lg": "10px",
    "--r-sm": "6px",
    "--elevation-overlay": "0 4px 10px #0000004d",
} as CSSProperties;

type ProductCardMoreMenuProps = {
    ariaLabel: string;
    items: MenuProps["items"];
    buttonClassName?: string;
    placement?: "bottomRight" | "topRight";
};

export function ProductCardMoreMenu({ ariaLabel, items, buttonClassName, placement = "bottomRight" }: ProductCardMoreMenuProps) {
    return (
        <Dropdown
            rootClassName="product-card-more-menu"
            placement={placement}
            trigger={["click"]}
            menu={{
                className: "product-card-more-menu__list",
                style: menuStyle,
                items,
                onClick: ({ domEvent }) => domEvent.stopPropagation(),
            }}
        >
            <button
                type="button"
                className={cn("product-card-more-menu__trigger grid h-7 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-[#919191] hover:bg-[#2a2a2a]! hover:text-white! focus-visible:bg-[#2a2a2a] focus-visible:text-white [&_svg]:size-4", buttonClassName)}
                aria-label={ariaLabel}
                title="更多操作"
                onClick={(event) => event.stopPropagation()}
            >
                <MoreHorizontal aria-hidden="true" />
            </button>
        </Dropdown>
    );
}
