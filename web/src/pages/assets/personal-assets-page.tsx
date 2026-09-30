import { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Input, Modal, Popconfirm, type MenuProps } from "antd";
import { Box, RotateCcw, Search } from "lucide-react";

import personalAudioPlaceholder from "@/assets/product-assets/audio-placeholder.svg";
import personalCheckboxNormal from "@/assets/product-assets/checkbox-normal.svg";
import personalCheckboxSelected from "@/assets/product-assets/checkbox-selected.svg";
import personalFolderPlaceholder from "@/assets/product-assets/folder-placeholder.svg";
import personalNewFolderIcon from "@/assets/product-assets/new-folder.svg";
import personalPlayIcon from "@/assets/product-assets/play.svg";
import personalSearchIcon from "@/assets/product-assets/search.svg";
import personalSelectionClose from "@/assets/product-assets/selection-close-design.svg";
import personalSelectionDelete from "@/assets/product-assets/selection-delete-design.svg";
import personalSelectionDownload from "@/assets/product-assets/selection-download-design.svg";
import personalSelectionMove from "@/assets/product-assets/selection-move.svg";
import personalSelectionTag from "@/assets/product-assets/selection-tag.svg";
import personalTagIcon from "@/assets/product-assets/tag-manage.svg";
import personalUploadIcon from "@/assets/product-assets/upload.svg";
import { AssetMediaPreview } from "@/components/asset-media-preview";
import { PaginationBar } from "@/components/layout/workspace-page";
import selectArrowIcon from "@/assets/product-assets/select-arrow.svg";
import { WorkspaceState } from "@/components/layout/workspace-state";
import { ProductBlackSelect } from "@/components/ui/product/product-black-select";
import { ProductCardMoreMenu } from "@/components/ui/product/product-card-more-menu";
import { cn } from "@/lib/utils";
import type { AssetFolder } from "@/services/api/user-data";

import type { LibraryAsset } from "./asset-view-types";
import { LanhuAssetUploadModal, LanhuFolderEditorModal, LanhuTagManagerModal, type LanhuAssetUploadValue } from "../personal-asset-upload";

type FolderOption = { label: string; value: string };
type ViewMode = "library" | "trash";

type PersonalAssetsPageProps = {
    viewMode: ViewMode;
    folderFilter: string;
    folders: AssetFolder[];
    folderCounts: Record<string, number>;
    activeAssets: LibraryAsset[];
    visibleAssets: LibraryAsset[];
    selectedIds: string[];
    selectedAssetCount: number;
    knownTags: string[];
    tagFilters: string[];
    keyword: string;
    trashCount: number;
    retentionDays: number;
    folderOptions: FolderOption[];
    page: number;
    pageSize: number;
    totalAssets: number;
    onBackToLibrary: () => void;
    onTagFiltersChange: (tags: string[]) => void;
    onKeywordChange: (keyword: string) => void;
    onUpload: () => void;
    onCreateFolder: () => void;
    onOpenTagManager: () => void;
    onEmptyTrash: () => void;
    onLeaveTrash: () => void;
    onOpenFolder: (folderId: string) => void;
    onRenameFolder: (folder: AssetFolder) => void;
    onDeleteFolder: (folder: AssetFolder) => void;
    onSelectAsset: (assetId: string, selected: boolean) => void;
    onOpenAsset: (asset: LibraryAsset) => void;
    onRenameAsset: (asset: LibraryAsset, title: string) => Promise<boolean>;
    onEditTags: (asset: LibraryAsset) => void;
    onDownloadAsset: (asset: LibraryAsset) => void;
    onArchiveAsset: (asset: LibraryAsset) => void;
    onRestoreAsset: (asset: LibraryAsset) => void;
    onDeleteAsset: (asset: LibraryAsset) => void;
    onMoveAssets: (assetIds: string[], folderId: string) => void;
    onPageChange: (page: number, pageSize: number) => void;
    onClearSelection: () => void;
    onEditSelectedTags: () => void;
    onDownloadSelected: () => void;
    onRestoreSelected: () => void;
    onDeleteSelected: () => void;
};

const inputFieldClass =
    "min-w-0 [&_.ant-input-affix-wrapper]:!min-h-9 [&_.ant-input-affix-wrapper]:!rounded-md [&_.ant-input-affix-wrapper]:!border-[#3a3a3a] [&_.ant-input-affix-wrapper]:!bg-[#252525] [&_.ant-input-affix-wrapper]:!shadow-none [&_.ant-input]:placeholder:!text-[13px] [&_.ant-input]:placeholder:!text-[#929292]";
const actionClass = "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent bg-[#2c2c2c] px-[13px] text-[13px] text-white shadow-none hover:bg-[#3c3c3c] [&_img]:size-4";

export function PersonalAssetsPage(props: PersonalAssetsPageProps) {
    const [assetUploadOpen, setAssetUploadOpen] = useState(false);
    const [folderCreateOpen, setFolderCreateOpen] = useState(false);
    const [folderCreateName, setFolderCreateName] = useState("");
    const [tagManagerOpen, setTagManagerOpen] = useState(false);
    const folderName = props.folders.find((folder) => folder.id === props.folderFilter)?.name;
    const selectedAssetIds = props.selectedIds.filter((id) => props.visibleAssets.some((asset) => asset.id === id) || props.activeAssets.some((asset) => asset.id === id));

    const closeFolderCreate = () => {
        setFolderCreateOpen(false);
        setFolderCreateName("");
    };

    const submitUpload = (_value: LanhuAssetUploadValue) => {
        setAssetUploadOpen(false);
    };

    const submitFolderCreate = () => {
        if (!folderCreateName.trim()) return;
        closeFolderCreate();
    };

    return (
        <section className="relative flex h-full min-h-0 flex-col bg-[#191919] text-white max-[720px]:min-h-[calc(100dvh-120px)]">
            <header className="grid min-h-14 shrink-0 grid-cols-[minmax(126px,1fr)_minmax(190px,250px)_minmax(170px,220px)_auto] items-center gap-3 px-10 py-5 max-[1040px]:grid-cols-[minmax(120px,1fr)_minmax(180px,220px)_minmax(170px,210px)] max-[1040px]:px-6 max-[720px]:flex max-[720px]:flex-wrap max-[720px]:px-4 max-[720px]:py-3.5 pb-0">
                <div className="flex min-w-0 items-center gap-2 max-[720px]:w-full">
                    {props.folderFilter !== "all" && props.viewMode === "library" ? (
                        <button type="button" className="inline-flex size-6 items-center justify-center border-0 bg-transparent p-0 text-[25px] text-[#d6d6d6]" onClick={props.onBackToLibrary} aria-label="返回">
                            ‹
                        </button>
                    ) : null}
                    <h1 className="m-0 overflow-hidden text-xl leading-6 font-bold text-ellipsis whitespace-nowrap text-[#f5f5f5]">{props.viewMode === "trash" ? "回收站" : props.folderFilter === "all" ? "个人资产库" : folderName || "未分类"}</h1>
                </div>
                <ProductBlackSelect
                    aria-label="按标签搜索资产"
                    size="small"
                    mode="tags"
                    suffixIcon={<img src={selectArrowIcon} alt="" />}
                    className="max-[720px]:min-w-[220px] bg-[#2C2C2C] border-none max-[720px]:flex-1"
                    value={props.tagFilters}
                    maxTagCount="responsive"
                    placeholder="请选择标签进行搜索"
                    options={props.knownTags.map((tag) => ({ label: tag, value: tag }))}
                    onChange={props.onTagFiltersChange}
                />
                <Input
                    allowClear
                    className="canvas-projects-page__search h-8! w-[202px]"
                    prefix={<Search className="size-[13px] text-[#929292]" />}
                    value={props.keyword}
                    placeholder="请输入名称进行搜索"
                    onChange={(event) => props.onKeywordChange(event.target.value)}
                />
                {props.viewMode === "library" ? (
                    <div className="flex items-center gap-2 whitespace-nowrap max-[1040px]:col-span-full max-[1040px]:justify-end max-[720px]:w-full max-[720px]:justify-start max-[720px]:overflow-x-auto">
                        <button type="button" className={actionClass} onClick={() => setAssetUploadOpen(true)}>
                            <img src={personalUploadIcon} alt="" aria-hidden />
                            <span>上传资产</span>
                        </button>
                        <button type="button" className={actionClass} onClick={() => setFolderCreateOpen(true)}>
                            <img src={personalNewFolderIcon} alt="" aria-hidden />
                            <span>新建文件夹</span>
                        </button>
                        <button type="button" className={actionClass} onClick={() => setTagManagerOpen(true)}>
                            <img src={personalTagIcon} alt="" aria-hidden />
                            <span>标签管理</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 whitespace-nowrap max-[1040px]:col-span-full max-[1040px]:justify-end max-[720px]:w-full max-[720px]:justify-start max-[720px]:overflow-x-auto">
                        {props.trashCount ? (
                            <Popconfirm title="确定清空回收站吗？" description="清空后不可恢复。" onConfirm={props.onEmptyTrash} okText="清空" cancelText="取消">
                                <Button danger icon={<RotateCcw />}>
                                    清空
                                </Button>
                            </Popconfirm>
                        ) : null}
                        <Button icon={<RotateCcw />} onClick={props.onLeaveTrash}>
                            返回资产库
                        </Button>
                    </div>
                )}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-10 pt-4 pb-[120px] [scrollbar-color:#4a4a4a_transparent] [scrollbar-width:thin] max-[1040px]:px-6 max-[720px]:overflow-visible max-[720px]:px-4 max-[720px]:pt-3.5 max-[720px]:pb-[100px]">
                {props.viewMode === "trash" ? (
                    <p className="mt-0 mb-3.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-[9px] text-xs text-[#c9a66d]">回收站内的资产将在 {props.retentionDays} 天后自动清除，您可以在此还原或彻底删除。</p>
                ) : null}
                {props.viewMode === "library" && props.folderFilter === "all" ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-3 gap-y-[22px] max-[720px]:grid-cols-[repeat(auto-fill,minmax(136px,1fr))]">
                        {props.folders.map((folder) => (
                            <PersonalFolderCard
                                key={folder.id}
                                folder={folder}
                                count={props.folderCounts[folder.id] ?? props.activeAssets.filter((asset) => asset.folderId === folder.id).length}
                                onOpen={() => props.onOpenFolder(folder.id)}
                                onRename={() => props.onRenameFolder(folder)}
                                onDelete={() => props.onDeleteFolder(folder)}
                            />
                        ))}
                        {props.visibleAssets.map((asset) => (
                            <PersonalAssetCard
                                key={asset.id}
                                asset={asset}
                                selected={props.selectedIds.includes(asset.id)}
                                onSelect={(selected) => props.onSelectAsset(asset.id, selected)}
                                onOpen={() => props.onOpenAsset(asset)}
                                onRename={(title) => props.onRenameAsset(asset, title)}
                                onTags={() => props.onEditTags(asset)}
                                onDownload={() => props.onDownloadAsset(asset)}
                                onArchive={() => props.onArchiveAsset(asset)}
                                folderOptions={props.folderOptions}
                                onMove={(folderId) => props.onMoveAssets([asset.id], folderId)}
                            />
                        ))}
                    </div>
                ) : props.visibleAssets.length ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-3 gap-y-[22px] max-[720px]:grid-cols-[repeat(auto-fill,minmax(136px,1fr))]">
                        {props.visibleAssets.map((asset) => (
                            <PersonalAssetCard
                                key={asset.id}
                                asset={asset}
                                selected={props.selectedIds.includes(asset.id)}
                                isTrash={props.viewMode === "trash"}
                                onSelect={(selected) => props.onSelectAsset(asset.id, selected)}
                                onOpen={() => props.onOpenAsset(asset)}
                                onRename={(title) => props.onRenameAsset(asset, title)}
                                onTags={() => props.onEditTags(asset)}
                                onDownload={() => props.onDownloadAsset(asset)}
                                onArchive={() => props.onArchiveAsset(asset)}
                                onRestore={() => props.onRestoreAsset(asset)}
                                onDelete={() => props.onDeleteAsset(asset)}
                                folderOptions={props.folderOptions}
                                onMove={(folderId) => props.onMoveAssets([asset.id], folderId)}
                            />
                        ))}
                    </div>
                ) : (
                    <WorkspaceState icon="assets" compact title={props.viewMode === "trash" ? "回收站是空的" : "没有匹配的资产"} description={props.viewMode === "trash" ? "删除的资产会暂存在这里。" : "调整名称、标签或文件夹后再试。"} />
                )}
                {props.totalAssets > props.pageSize ? <PaginationBar current={props.page} pageSize={props.pageSize} total={props.totalAssets} pageSizeOptions={[40, 80, 120]} onChange={props.onPageChange} /> : null}
            </div>

            {props.selectedAssetCount ? (
                <PersonalAssetsBatchBar
                    count={props.selectedAssetCount}
                    isTrash={props.viewMode === "trash"}
                    folders={props.folderOptions}
                    onClear={props.onClearSelection}
                    onMove={(folderId) => props.onMoveAssets(selectedAssetIds, folderId)}
                    onTags={props.onEditSelectedTags}
                    onDownload={props.onDownloadSelected}
                    onRestore={props.onRestoreSelected}
                    onDelete={props.onDeleteSelected}
                />
            ) : null}

            <LanhuAssetUploadModal
                open={assetUploadOpen}
                initialFolderId={props.folderFilter !== "all" && props.folderFilter !== "uncategorized" ? props.folderFilter : ""}
                folders={props.folderOptions}
                tags={props.knownTags.map((tag) => ({ label: tag, value: tag }))}
                onCancel={() => setAssetUploadOpen(false)}
                onSave={submitUpload}
            />

            <LanhuFolderEditorModal open={folderCreateOpen} mode="create" value={folderCreateName} onChange={setFolderCreateName} onCancel={closeFolderCreate} onSave={submitFolderCreate} />

            <LanhuTagManagerModal
                open={tagManagerOpen}
                tags={props.knownTags.map((name) => ({
                    name,
                    count: props.activeAssets.filter((asset) => asset.tags?.includes(name)).length,
                }))}
                onCancel={() => setTagManagerOpen(false)}
            />
        </section>
    );
}

function PersonalFolderCard({ folder, count, onOpen, onRename, onDelete }: { folder: AssetFolder; count: number; onOpen: () => void; onRename: () => void; onDelete: () => void }) {
    return (
        <article className="group min-w-0 text-white">
            <button type="button" className="relative flex aspect-[1.24/1] w-full items-center justify-center overflow-hidden rounded-lg border-0 bg-[#242424] p-0" onClick={onOpen} aria-label={`打开文件夹 ${folder.name}`}>
                <span className="absolute top-1.5 left-1.5 z-[2] inline-flex h-[18px] items-center rounded-[2px] bg-[#131313e0] px-1.5 text-[10px] leading-[18px]">文件夹</span>
                <img className="size-[60px] object-contain" src={personalFolderPlaceholder} alt="" aria-hidden />
            </button>
            <div className="mt-[5px] flex h-7 min-w-0 items-center gap-1 overflow-hidden px-[3px]">
                <button type="button" className="w-0 min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-sm leading-5 font-bold text-white" onClick={onOpen} title={folder.name}>
                    {folder.name}
                </button>
                <ProductCardMoreMenu
                    ariaLabel={`更多文件夹操作 ${folder.name}`}
                    buttonClassName="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    items={[
                        { key: "open", label: "打开", onClick: onOpen },
                        { key: "rename", label: "重命名", onClick: onRename },
                        { key: "delete", label: "删除文件夹", danger: true, onClick: onDelete },
                    ]}
                />
            </div>
            <div className="flex h-[18px] min-w-0 items-center gap-1 overflow-hidden px-[3px]">
                <span className="block max-w-[74px] overflow-hidden rounded-[3px] bg-[#2c2c2c] px-[5px] py-px text-[10px] leading-3.5 text-ellipsis whitespace-nowrap">{count} 个资产</span>
            </div>
            <time className="mt-px block px-[3px] text-xs leading-[17px] text-[#969799]">{formatAssetTime(folder.updatedAt || folder.createdAt)}</time>
        </article>
    );
}

function PersonalAssetCard({
    asset,
    selected,
    isTrash = false,
    onSelect,
    onOpen,
    onRename,
    onTags,
    onDownload,
    onArchive,
    onRestore,
    onDelete,
    folderOptions,
    onMove,
}: {
    asset: LibraryAsset;
    selected: boolean;
    isTrash?: boolean;
    onSelect: (selected: boolean) => void;
    onOpen: () => void;
    onRename: (title: string) => Promise<boolean>;
    onTags: () => void;
    onDownload: () => void;
    onArchive: () => void;
    onRestore?: () => void;
    onDelete?: () => void;
    folderOptions: FolderOption[];
    onMove: (folderId: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [displayTitle, setDisplayTitle] = useState(asset.title);
    const [editingTitle, setEditingTitle] = useState(asset.title);
    const savingRef = useRef(false);
    const cancellingRef = useRef(false);
    const canDownload = asset.kind !== "text";
    useEffect(() => {
        setDisplayTitle(asset.title);
        if (!editing) setEditingTitle(asset.title);
    }, [asset.title, editing]);
    const startEditing = () => {
        cancellingRef.current = false;
        setEditingTitle(displayTitle);
        setEditing(true);
    };
    const stopEditing = () => {
        cancellingRef.current = true;
        setEditingTitle(displayTitle);
        setEditing(false);
    };
    const saveTitle = async () => {
        if (cancellingRef.current) {
            cancellingRef.current = false;
            return;
        }
        if (savingRef.current) return;
        const title = editingTitle.trim();
        if (!title || title === displayTitle) {
            setEditingTitle(displayTitle);
            setEditing(false);
            return;
        }
        savingRef.current = true;
        setEditing(false);
        const saved = await onRename(title);
        if (saved) setDisplayTitle(title);
        else setEditingTitle(displayTitle);
        savingRef.current = false;
    };
    const menuItems: MenuProps["items"] = isTrash
        ? [
              { key: "restore", label: "还原", onClick: onRestore },
              { key: "delete", label: "彻底删除", danger: true, onClick: onDelete },
          ]
        : [
              { key: "open", label: "打开", onClick: onOpen },
              { key: "rename", label: "重命名", onClick: startEditing },
              { key: "move", label: "移动文件夹", popupClassName: "product-card-more-submenu", children: folderOptions.map((folder) => ({ key: folder.value || "uncategorized", label: folder.label, onClick: () => onMove(folder.value) })) },
              { key: "tags", label: "设置标签", onClick: onTags },
              ...(canDownload ? [{ key: "download", label: "下载", onClick: onDownload }] : []),
              { key: "delete", label: "删除资产", danger: true, onClick: onArchive },
          ];
    const visibleTags = (asset.tags || []).slice(0, 2);
    const extraTagCount = Math.max(0, (asset.tags?.length || 0) - visibleTags.length);
    return (
        <article className="group min-w-0 text-white">
            <div className={cn("relative flex aspect-[1.2/1] w-full items-center justify-center overflow-hidden rounded-lg border border-transparent bg-[#242424]", selected && "border-white")}>
                <button type="button" className="absolute inset-0 size-full border-0 bg-transparent p-0" onClick={onOpen} aria-label={`查看资产 ${asset.title}`}>
                    {asset.kind === "audio" ? (
                        <img className="size-[60px] object-contain" src={personalAudioPlaceholder} alt="" aria-hidden />
                    ) : asset.kind === "text" ? (
                        <TextCover asset={asset} />
                    ) : asset.kind === "model" ? (
                        <ModelCover asset={asset} />
                    ) : (
                        <AssetMediaPreview asset={asset} alt={asset.title} className="size-full object-cover [&_img]:size-full [&_img]:object-cover" />
                    )}
                    {asset.kind === "video" ? <img className="absolute top-1/2 left-1/2 z-[2] size-8 -translate-x-1/2 -translate-y-1/2" src={personalPlayIcon} alt="" aria-hidden /> : null}
                </button>
                <span className="absolute top-1.5 left-1.5 z-[2] inline-flex h-[18px] items-center rounded-[2px] bg-[#131313e0] px-1.5 text-[10px] leading-[18px]">{assetKindLabel(asset.kind)}</span>
                <label className={cn("absolute top-[7px] right-[7px] z-[3] hidden cursor-pointer group-hover:block", selected && "block")}>
                    <input className="sr-only" type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} />
                    <img className="size-4" src={selected ? personalCheckboxSelected : personalCheckboxNormal} alt="" aria-hidden />
                    <span className="sr-only">选择 {asset.title}</span>
                </label>
            </div>
            <div className="mt-[5px] flex h-7 min-w-0 items-center gap-1 overflow-hidden px-[3px]">
                {editing && !isTrash ? (
                    <>
                        <Input
                            maxLength={80}
                            className="-mt-0.5! h-6! min-w-0 flex-1 rounded-none! border-0! bg-transparent! p-0! text-sm! leading-5! font-bold! text-white! shadow-none! outline-0! hover:border-0! focus:border-0! focus:bg-transparent! focus:shadow-none!"
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onBlur={() => void saveTitle()}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                                else if (event.key === "Escape") stopEditing();
                            }}
                            autoFocus
                        />
                    </>
                ) : (
                    <>
                        <button type="button" className="w-0 min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-sm leading-5 font-bold text-white" onClick={onOpen} title={displayTitle}>
                            {displayTitle}
                        </button>
                        <ProductCardMoreMenu ariaLabel={`更多资产操作 ${asset.title}`} buttonClassName="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" items={menuItems} />
                    </>
                )}
            </div>
            <div className="flex h-[18px] min-w-0 items-center gap-1 overflow-hidden px-[3px]">
                {visibleTags.length ? (
                    visibleTags.map((tag) => (
                        <span key={tag} title={tag} className="block max-w-[74px] overflow-hidden rounded-[3px] bg-[#2c2c2c] px-[5px] py-px text-[10px] leading-3.5 text-ellipsis whitespace-nowrap">
                            {tag}
                        </span>
                    ))
                ) : (
                    <span className="block max-w-[74px] overflow-hidden rounded-[3px] bg-[#2c2c2c] px-[5px] py-px text-[10px] leading-3.5 text-ellipsis whitespace-nowrap">未设置标签</span>
                )}
                {extraTagCount ? <small className="shrink-0 rounded-[3px] bg-[#2c2c2c] px-[5px] py-px text-[10px] leading-3.5 text-[#adadad]">+{extraTagCount}</small> : null}
            </div>
            <time className="mt-px block px-[3px] text-xs leading-[17px] text-[#969799]">{formatAssetTime(asset.createdAt)}</time>
        </article>
    );
}

function PersonalAssetsBatchBar({
    count,
    isTrash,
    folders,
    onClear,
    onMove,
    onTags,
    onDownload,
    onRestore,
    onDelete,
}: {
    count: number;
    isTrash: boolean;
    folders: FolderOption[];
    onClear: () => void;
    onMove: (folderId: string) => void;
    onTags: () => void;
    onDownload: () => void;
    onRestore: () => void;
    onDelete: () => void;
}) {
    const buttonClass = "inline-flex h-8 items-center justify-center gap-2 rounded-md border-0 bg-[#3c3c3c] px-3 text-[13px] text-white hover:bg-[#484848] [&_img]:size-4 [&_svg]:size-3.5";
    return (
        <div
            className="absolute right-1/2 bottom-5 z-30 flex h-[50px] w-[min(643px,calc(100%_-_48px))] translate-x-1/2 items-center gap-2 rounded-xl border border-[#363636] bg-[#262626] px-2.5 py-2 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.28)]"
            role="toolbar"
            aria-label="已选资产操作"
        >
            <button type="button" className="inline-flex size-7 items-center justify-center border-0 bg-transparent p-0" onClick={onClear} aria-label="取消选择">
                <img className="size-3" src={personalSelectionClose} alt="" aria-hidden />
            </button>
            <span>已选择{count}项</span>
            <div className="flex-1" />
            {isTrash ? (
                <button type="button" className={buttonClass} onClick={onRestore}>
                    <RotateCcw />
                    <span>还原</span>
                </button>
            ) : (
                <>
                    <Dropdown
                        rootClassName="product-card-more-menu"
                        placement="topRight"
                        trigger={["click"]}
                        menu={{ className: "product-card-more-menu__list", items: folders.map((folder) => ({ key: folder.value || "uncategorized", label: folder.label, onClick: () => onMove(folder.value) })) }}
                    >
                        <button type="button" className={buttonClass}>
                            <img src={personalSelectionMove} alt="" aria-hidden />
                            <span>移动到</span>
                        </button>
                    </Dropdown>
                    <button type="button" className={buttonClass} onClick={onTags}>
                        <img src={personalSelectionTag} alt="" aria-hidden />
                        <span>修改标签</span>
                    </button>
                    <button type="button" className={cn(buttonClass, "w-8 p-0")} aria-label="下载所选资产" onClick={onDownload}>
                        <img src={personalSelectionDownload} alt="" aria-hidden />
                    </button>
                </>
            )}
            <button type="button" className={cn(buttonClass, "w-8 bg-[#3c2a28] p-0 text-[#fa5151] hover:bg-[#533030]")} aria-label={isTrash ? "彻底删除所选资产" : "删除所选资产"} onClick={onDelete}>
                <img src={personalSelectionDelete} alt="" aria-hidden />
            </button>
        </div>
    );
}

export function PersonalAssetsTagModal({
    open,
    tags,
    selectedTags,
    tagCounts,
    trashCount,
    onToggleTag,
    onClose,
    onCreateText,
    onImportPackage,
    onUploadModel,
    onExportAll,
    onOpenTrash,
}: {
    open: boolean;
    tags: string[];
    selectedTags: string[];
    tagCounts: Record<string, number>;
    trashCount: number;
    onToggleTag: (tag: string) => void;
    onClose: () => void;
    onCreateText: () => void;
    onImportPackage: () => void;
    onUploadModel: () => void;
    onExportAll: () => void;
    onOpenTrash: () => void;
}) {
    return (
        <Modal className="library-modal" title="标签管理" open={open} footer={null} onCancel={onClose}>
            <p className="mt-0 mb-4 text-[13px] text-[#929292]">选择标签后即可筛选对应资产；资产标签可在卡片的“设置标签”中修改。</p>
            <div className="flex flex-wrap gap-2">
                {tags.length ? (
                    tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={cn("inline-flex h-[30px] items-center gap-2 rounded-md border border-[#444] bg-[#2c2c2c] px-2.5 text-xs text-[#eee]", selectedTags.includes(tag) && "border-white bg-[#444]")}
                            aria-pressed={selectedTags.includes(tag)}
                            onClick={() => onToggleTag(tag)}
                        >
                            <span>{tag}</span>
                            <small className="text-[#999]">{tagCounts[tag] || 0}</small>
                        </button>
                    ))
                ) : (
                    <span className="text-[13px] text-[#777]">暂无标签</span>
                )}
            </div>
            <div className="mt-[22px] flex flex-wrap gap-2 border-t border-[#363636] pt-3.5">
                <Button onClick={onCreateText}>新增文本资产</Button>
                <Button onClick={onImportPackage}>导入素材包</Button>
                <Button onClick={onUploadModel}>上传 3D 模型</Button>
                <Button onClick={onExportAll}>导出全部资产</Button>
                <Button onClick={onOpenTrash}>回收站（{trashCount}）</Button>
            </div>
        </Modal>
    );
}

function TextCover({ asset }: { asset: Extract<LibraryAsset, { kind: "text" }> }) {
    return (
        <div className="grid size-full place-items-center overflow-hidden bg-[#f7f7f7] p-3 text-left text-xs leading-5 text-[#333]">
            <p className="line-clamp-5 m-0 w-full">{asset.data.content || "空白文本素材"}</p>
        </div>
    );
}
function ModelCover({ asset }: { asset: Extract<LibraryAsset, { kind: "model" }> }) {
    return (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-[#242424] text-xs text-[#ddd]">
            <Box className="size-8 stroke-[1.5]" />
            <span className="max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap">{asset.data.fileName}</span>
        </div>
    );
}
function assetKindLabel(kind: LibraryAsset["kind"]) {
    return kind === "image" ? "图片" : kind === "video" ? "视频" : kind === "audio" ? "音频" : kind === "model" ? "3D 模型" : "文本";
}
function formatAssetTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
