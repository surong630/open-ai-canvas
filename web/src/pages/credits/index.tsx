import { NavLink, useNavigate } from "react-router";

import backIcon from "@/assets/credits/icon-core-back@2x.png";
import balanceIcon from "@/assets/credits/core-icon-number@2x.png";
import navAssets from "@/assets/credits/nav-assets@2x.png";
import navAssetsSelected from "@/assets/credits/nav-assets-selected@2x.png";
import navHome from "@/assets/credits/nav-home@2x.png";
import navHomeNormal from "@/assets/credits/nav-home-normal@2x.png";
import navProjects from "@/assets/credits/nav-projects@2x.png";
import navProjectsSelected from "@/assets/credits/nav-projects-selected@2x.png";
import { ProductPageHeader } from "@/components/layout/product-page-header";
import { getWallet } from "@/services/api/wallet";
import { useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";

import { CreditDetailsPanel } from "./credit-details-panel";
import "./credits-page.css";

export default function CreditsPage() {
    const navigate = useNavigate();
    const appearance = useAppearanceStore((state) => state.appearance);
    const user = useUserStore((state) => state.user);
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);

    return (
        <main className="credits-page">
            <CreditsSidebar brandName={appearance.brandName || "系统名称"} />

            <section className="credits-page__workspace">
                <ProductPageHeader className="credits-page__topbar" />

                <div className="credits-page__content">
                    <button type="button" className="credits-page__back" onClick={() => navigate("/home")}><img src={backIcon} alt="" />积分明细</button>
                    <PersonalCreditDetails userId={user?.id} enabled={creditsEnabled} />
                </div>
            </section>
        </main>
    );
}

function PersonalCreditDetails({ userId, enabled }: { userId?: string; enabled: boolean }) {
    return (
        <CreditDetailsPanel
            balanceLabel="当前账户总余额"
            balanceIcon={balanceIcon}
            enabled={Boolean(userId && enabled)}
            queryKey={["credit-details", userId]}
            loadWallet={({ page, pageSize, type, startTime, endTime }) => getWallet(page, pageSize, type, { startTime, endTime })}
        />
    );
}

function CreditsSidebar({ brandName }: { brandName: string }) {
    return (
        <aside className="credits-page__sidebar">
            <h1>{brandName}</h1>
            <nav aria-label="首页导航">
                <NavLink to="/home" className="active"><NavIcon normal={navHomeNormal} selected={navHome} />首页</NavLink>
                <NavLink to="/canvas-projects"><NavIcon normal={navProjects} selected={navProjectsSelected} />项目</NavLink>
                <NavLink to="/assets"><NavIcon normal={navAssets} selected={navAssetsSelected} />资产</NavLink>
            </nav>
        </aside>
    );
}

function NavIcon({ normal, selected }: { normal: string; selected: string }) {
    return <span className="credits-page__nav-icon" aria-hidden="true"><img className="is-normal" src={normal} alt="" /><img className="is-selected" src={selected} alt="" /></span>;
}
