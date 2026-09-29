import { Box, FileText } from "lucide-react";

import cardDeleteIcon from "@/assets/product-assets/card-delete.svg";
import cardDownloadIcon from "@/assets/product-assets/card-download.svg";
import checkboxNormalIcon from "@/assets/product-assets/checkbox-normal.svg";
import checkboxSelectedIcon from "@/assets/product-assets/checkbox-selected.svg";
import historyAudioEmpty from "@/assets/product-assets/history-audio-empty@2x.png";
import historyImageEmpty from "@/assets/product-assets/history-image-empty@2x.png";
import selectionCloseIcon from "@/assets/product-assets/selection-close.svg";
import selectionDeleteIcon from "@/assets/product-assets/selection-delete.svg";
import selectionDownloadIcon from "@/assets/product-assets/selection-download.svg";
import selectionSaveIcon from "@/assets/product-assets/selection-save.svg";
import { AssetMediaPreview } from "@/components/asset-media-preview";
import { cn } from "@/lib/utils";

import type { HistoryKind, LibraryAsset } from "./asset-view-types";

type AssetHistoryPageProps = {
    groups: Array<{ key: string; label: string; assets: LibraryAsset[] }>;
    counts: Record<HistoryKind, number>;
    kind: HistoryKind;
    selectedIds: string[];
    onKindChange: (kind: HistoryKind) => void;
    onOpen: (asset: LibraryAsset) => void;
    onSelect: (assetId: string, selected: boolean) => void;
    onClear: () => void;
    onSaveAssets: () => void;
    onDownload: () => void;
    onDelete: () => void;
    onDownloadAsset: (asset: LibraryAsset) => void;
    onDeleteAsset: (asset: LibraryAsset) => void;
};

const tabs: Array<{ value: HistoryKind; label: string }> = [
    { value: "all", label: "全部" },
    { value: "image", label: "图片" },
    { value: "video", label: "视频" },
    { value: "audio", label: "音频" },
];

export function AssetHistoryPage({ groups, counts, kind, selectedIds, onKindChange, onOpen, onSelect, onClear, onSaveAssets, onDownload, onDelete, onDownloadAsset, onDeleteAsset }: AssetHistoryPageProps) {
    return (
        <div className="relative flex h-full min-h-0 flex-col px-10 pt-[9px] pl-[41px] max-[1040px]:px-6 max-[720px]:h-auto max-[720px]:min-h-[calc(100dvh-120px)] max-[720px]:px-4 max-[720px]:pt-[18px]">
            <header className="shrink-0">
                <h2 className="m-0 text-xl leading-7 font-bold text-[#f5f5f5]">生成历史</h2>
                <nav className="mt-[22px] flex items-center gap-[26px]" aria-label="生成历史类型">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            className={cn("inline-flex h-[34px] items-center gap-1.5 rounded-[20px] border-0 bg-transparent p-0 text-sm text-[#8e8e8e]", kind === tab.value && "bg-[#2b2b2b] px-4 font-bold text-white")}
                            aria-pressed={kind === tab.value}
                            onClick={() => onKindChange(tab.value)}
                        >
                            <span>{tab.label}</span>
                            <small className={cn("text-[13px] tabular-nums text-[#606060]", kind === tab.value && "text-[#858585]")}>{counts[tab.value]}</small>
                        </button>
                    ))}
                </nav>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[25px] pb-[120px] [scrollbar-color:#4a4a4a_transparent] [scrollbar-width:thin] max-[720px]:overflow-visible">
                {groups.length ? groups.map((group, groupIndex) => (
                    <section key={group.key} className={cn(groupIndex > 0 && "mt-[29px]")} aria-labelledby={`asset-history-${group.key}`}>
                        <h3 id={`asset-history-${group.key}`} className="mt-0 mb-[18px] text-base leading-[22px] font-bold text-[#f0f0f0]">{group.label}</h3>
                        <div className="grid grid-cols-[repeat(auto-fill,136px)] gap-3 max-[720px]:grid-cols-[repeat(auto-fill,minmax(128px,1fr))]">
                            {group.assets.map((asset) => {
                                const selected = selectedIds.includes(asset.id);
                                return (
                                    <article key={asset.id} className={cn("group relative size-[136px] overflow-hidden rounded-lg border border-transparent bg-[#222] max-[720px]:size-auto max-[720px]:aspect-square", selected && "border-white")}>
                                        <button type="button" className="size-full border-0 bg-transparent p-0" aria-label={`查看 ${asset.title}`} onClick={() => onOpen(asset)}>
                                            <AssetHistoryMedia asset={asset} />
                                        </button>
                                        <label className={cn("absolute top-2.5 right-2.5 z-[3] cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100", selected && "opacity-100")}>
                                            <input className="sr-only" type="checkbox" checked={selected} aria-label={`选择 ${asset.title}`} onChange={(event) => onSelect(asset.id, event.target.checked)} />
                                            <img className="size-4" src={selected ? checkboxSelectedIcon : checkboxNormalIcon} alt="" aria-hidden="true" />
                                        </label>
                                        <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 z-[2] flex justify-between gap-2.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                                            <button type="button" className="grid h-5 w-[53px] place-items-center rounded bg-black/60 p-0 hover:bg-black/80" aria-label={`下载 ${asset.title}`} title="下载" onClick={() => onDownloadAsset(asset)}><img className="size-3 object-contain" src={cardDownloadIcon} alt="" /></button>
                                            <button type="button" className="grid h-5 w-[53px] place-items-center rounded bg-black/60 p-0 hover:bg-black/80" aria-label={`删除 ${asset.title}`} title="删除" onClick={() => onDeleteAsset(asset)}><img className="h-3.5 w-3 object-contain" src={cardDeleteIcon} alt="" /></button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )) : <p className="mt-[150px] text-center text-xs text-[#6e6e6e]">暂无历史记录</p>}
            </div>

            {selectedIds.length ? (
                <div className="absolute right-1/2 bottom-5 z-[5] flex min-h-[52px] w-[min(660px,calc(100%_-_80px))] translate-x-1/2 items-center justify-between gap-4 rounded-[14px] border border-[#3e3e3e] bg-[#252525] py-2 pr-2.5 pl-4 shadow-[0_12px_32px_rgba(0,0,0,.26)] max-[720px]:fixed max-[720px]:right-4 max-[720px]:bottom-4 max-[720px]:left-4 max-[720px]:w-auto max-[720px]:translate-x-0" role="toolbar" aria-label="已选资产操作">
                    <button type="button" className="inline-flex items-center gap-2.5 border-0 bg-transparent p-0 text-white" onClick={onClear}><img className="size-3 object-contain" src={selectionCloseIcon} alt="" /><span className="text-[13px] text-[#d5d5d5]">已选择{selectedIds.length}项</span></button>
                    <div className="flex items-center gap-2">
                        <button type="button" className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border-0 bg-[#3c3c3c] px-3 text-[13px] leading-none text-white hover:bg-[#484848]" onClick={onSaveAssets}><img className="size-3.5 object-contain" src={selectionSaveIcon} alt="" /><span>保存到资产</span></button>
                        <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg border-0 bg-[#3c3c3c] p-0 hover:bg-[#484848]" aria-label="下载已选资产" title="下载" onClick={onDownload}><img className="size-4 object-contain" src={selectionDownloadIcon} alt="" /></button>
                        <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg border-0 bg-[#452929] p-0 text-[#ff5757] hover:bg-[#533030]" aria-label="删除已选资产" title="删除" onClick={onDelete}><img className="size-4 object-contain" src={selectionDeleteIcon} alt="" /></button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function AssetHistoryMedia({ asset }: { asset: LibraryAsset }) {
    const duration = asset.kind === "video" || asset.kind === "audio" ? formatAssetClock(asset.data.durationMs) : null;
    const fallbackClass = "relative grid size-full place-items-center bg-[#242424] text-[#ddd]";
    const durationClass = "absolute bottom-1.5 left-1.5 rounded-[3px] bg-black/60 px-[5px] py-0.5 text-[10px] leading-3.5 text-white";
    if (asset.kind === "audio") return <span className={fallbackClass}><img className="size-full object-cover" src={historyAudioEmpty} alt="" aria-hidden="true" />{duration ? <small className={durationClass}>{duration}</small> : null}</span>;
    if (asset.kind === "text") return <span className={fallbackClass}><FileText className="size-[34px] stroke-[1.6]" aria-hidden /></span>;
    if (asset.kind === "model") return <span className={fallbackClass}><Box className="size-[34px] stroke-[1.6]" aria-hidden /></span>;
    return (
        <>
            <AssetMediaPreview asset={asset} alt={asset.title} className="size-full object-cover [&_img]:size-full [&_img]:object-cover" fallback={<span className={fallbackClass}><img className="size-full object-cover" src={historyImageEmpty} alt="" aria-hidden="true" /></span>} />
            {duration ? <small className={durationClass}>{duration}</small> : null}
        </>
    );
}

export function groupAssetsByDate(assets: LibraryAsset[]) {
    const groups = new Map<string, LibraryAsset[]>();
    [...assets]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .forEach((asset) => {
            const timestamp = Date.parse(asset.createdAt);
            const key = Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString("sv-SE") : "unknown";
            groups.set(key, [...(groups.get(key) || []), asset]);
        });
    return Array.from(groups, ([key, groupedAssets]) => ({ key, label: key === "unknown" ? "时间未知" : key, assets: groupedAssets }));
}

function formatAssetClock(durationMs?: number) {
    if (!durationMs || durationMs < 1000) return null;
    const total = Math.round(durationMs / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
