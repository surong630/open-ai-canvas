import type { ReactNode } from "react";

import historyIcon from "@/assets/product-assets/history.svg";
import libraryIcon from "@/assets/product-assets/library.svg";
import { ProductPrimarySidebar } from "@/components/layout/product-primary-sidebar";
import { cn } from "@/lib/utils";

import type { AssetSection } from "./asset-view-types";

type ProductAssetsShellProps = {
    section: AssetSection;
    historyCount: number;
    libraryCount: number;
    onSectionChange: (section: AssetSection) => void;
    children: ReactNode;
};

const navButtonClass = "flex h-10 w-full items-center  font-bold justify-between gap-3 rounded-lg border-0 bg-transparent px-3.5 text-sm text-[#a8a8a8] hover:text-white";

export function ProductAssetsShell({ section, historyCount, libraryCount, onSectionChange, children }: ProductAssetsShellProps) {
    return (
        <main className="grid h-dvh min-h-dvh w-full grid-cols-[241px_minmax(0,1fr)] overflow-hidden bg-[#191919] font-['Alibaba_PuHuiTi_3.0','PingFang_SC','Microsoft_YaHei','Hiragino_Sans_GB',sans-serif] text-white max-[720px]:min-h-dvh max-[720px]:h-auto max-[720px]:grid-cols-1 max-[720px]:overflow-visible">
            <ProductPrimarySidebar />

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden max-[720px]:overflow-visible">
                <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[241px_minmax(0,1fr)] overflow-hidden max-[1040px]:grid-cols-[210px_minmax(0,1fr)] max-[720px]:block max-[720px]:overflow-visible">
                    <aside className="min-h-0 border-r border-[#303030] px-[15px] py-[17px] max-[720px]:flex max-[720px]:gap-2 max-[720px]:overflow-x-auto max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:px-4 max-[720px]:py-2.5" aria-label="资产导航">
                        <button type="button" className={cn(navButtonClass, section === "history" && "bg-[#1E1E1E] text-white")} aria-pressed={section === "history"} onClick={() => onSectionChange("history")}>
                            <span className="inline-flex min-w-0 items-center gap-2.5"><img className="size-4 object-contain" src={historyIcon} alt="" aria-hidden="true" />生成历史</span>
                            <small className={cn("text-[13px] tabular-nums text-[#929292]")}>{historyCount}</small>
                        </button>
                        <button type="button" className={cn(navButtonClass, "max-[720px]:min-w-[150px]", section === "library" && "bg-[#1E1E1E] font-bold text-white")} aria-pressed={section === "library"} onClick={() => onSectionChange("library")}>
                            <span className="inline-flex min-w-0 items-center gap-2.5"><img className="size-4 object-contain" src={libraryIcon} alt="" aria-hidden="true" />个人资产库</span>
                            <small className={cn("text-[13px] tabular-nums text-[#929292]")}>{libraryCount}</small>
                        </button>
                    </aside>
                    <section className="min-h-0 min-w-0 overflow-hidden bg-[#191919] max-[720px]:overflow-visible">{children}</section>
                </div>
            </section>
        </main>
    );
}
