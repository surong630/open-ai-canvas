import { NavLink } from "react-router";

import navAssetsNormal from "@/assets/canvas-projects/nav-assets-normal@2x.png";
import navHomeNormal from "@/assets/canvas-projects/nav-home-normal@2x.png";
import navProjectsSelected from "@/assets/canvas-projects/nav-projects-selected@2x.png";
import navAssetsSelected from "@/assets/product-home/nav-assets-selected@2x.png";
import navHomeSelected from "@/assets/product-home/nav-home@2x.png";
import navProjectsNormal from "@/assets/product-home/nav-projects@2x.png";
import { cn } from "@/lib/utils";
import { useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";

import "./product-primary-sidebar.css";

const productNavigation = [
    { to: "/home", label: "首页", normalIcon: navHomeNormal, selectedIcon: navHomeSelected, end: true },
    { to: "/canvas-projects", label: "项目", normalIcon: navProjectsNormal, selectedIcon: navProjectsSelected, end: false },
    { to: "/assets", label: "资产", normalIcon: navAssetsNormal, selectedIcon: navAssetsSelected, end: true },
] as const;

export function ProductPrimarySidebar({ className }: { className?: string }) {
    const brandName = useAppearanceStore((state) => state.appearance.brandName);
    const user = useUserStore((state) => state.user);

    return (
        <aside className={cn("product-primary-sidebar", className)}>
            <h1>{brandName || "系统名称"}</h1>
            <nav aria-label="首页导航">
                {productNavigation.map((item) => (
                    <NavLink
                        key={item.to}
                        to={!user && item.to !== "/home" ? `/email-login?next=${encodeURIComponent(item.to)}` : item.to}
                        end={item.end}
                        className={({ isActive }) => cn(isActive && "active")}
                    >
                        {({ isActive }) => (
                            <>
                                <span className="product-primary-sidebar__icon" aria-hidden="true">
                                    <img className={cn("is-normal", isActive && "is-hidden")} src={item.normalIcon} alt="" />
                                    <img className={cn("is-selected", isActive && "is-visible")} src={item.selectedIcon} alt="" />
                                </span>
                                <span className="product-primary-sidebar__label">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
