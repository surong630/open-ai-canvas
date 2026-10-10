import { useEffect, useMemo, useState } from "react";
import { App, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FileText, Images, Plus } from "lucide-react";
import folderIcon from "@/assets/canvas-assets/work-icon-folder.png";
import audioAssetImage from "@/assets/canvas-assets/work-sound.png";
import { CachedResourceImage } from "@/components/cached-resource-image";
import videoPlayIcon from "@/assets/canvas-assets/work-video-play.png";
import { WorkspaceState } from "@/components/layout/workspace-state";
import { listAssetFolders, type AssetFolder } from "@/services/api/user-data";
import { loadAssetLibraryPage } from "@/services/user-data-sync";
import { useUserStore } from "@/stores/use-user-store";
import type { Asset } from "@/stores/use-asset-store";
import { assetPickerItemsToInsertPayloads, type InsertAssetPayload } from "./asset-picker-modal";

const developmentFolderMock: AssetFolder[] = [
    { id: "mock-material", name: "文件夹名称", parentId: "", position: 1, createdAt: "", updatedAt: "" },
];

/** 二开画布资产面板。与开源 CanvasWorkspaceAssetPanel 保持独立，严格按二开稿展示嵌套文件夹。 */
export function CanvasProductAssetPanel({ onInsert, onManage, onProjectAssets }: { onInsert: (payloads: InsertAssetPayload[]) => Promise<unknown>; onManage: () => void; onProjectAssets?: () => void }) {
    const { message } = App.useApp();
    const userId = useUserStore((state) => state.user?.id);
    const hydrated = useUserStore((state) => state.hydrated);
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [inserting, setInserting] = useState<string | null>(null);
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(input.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [input]);
    const foldersQuery = useQuery({ queryKey: ["canvas-product-asset-folders", userId], queryFn: listAssetFolders, enabled: Boolean(userId) && hydrated });
    const folders = foldersQuery.data?.folders || [];
    const displayFolders = import.meta.env.DEV && !folders.length ? developmentFolderMock : folders;
    const query = useQuery({ queryKey: ["canvas-product-assets", userId, search], queryFn: () => loadAssetLibraryPage({ page: 1, pageSize: 40, status: "active", query: search }), enabled: Boolean(userId) && hydrated });
    const assets = query.data?.assets ?? [];
    const assetsByFolder = useMemo(
        () =>
            assets.reduce((result, asset) => {
                const key = asset.folderId || "";
                result.set(key, [...(result.get(key) || []), asset]);
                return result;
            }, new Map<string, Asset[]>()),
        [assets],
    );
    const displayAssetsByFolder = useMemo(() => {
        if (!import.meta.env.DEV || folders.length || !assets.length) return assetsByFolder;
        const result = new Map<string, Asset[]>();
        assets.forEach((asset, index) => {
            const key = index < 3 ? "" : "mock-material";
            result.set(key, [...(result.get(key) || []), asset]);
        });
        return result;
    }, [assets, assetsByFolder, folders.length]);
    const insert = async (asset: Asset) => {
        if (inserting) return;
        setInserting(asset.id);
        try {
            await onInsert(assetPickerItemsToInsertPayloads([asset.id], [{ id: asset.id, title: asset.title, category: asset.category || "other", kindLabel: asset.kind, asset }]));
        } catch (error) {
            message.error(error instanceof Error ? error.message : "插入素材失败");
        } finally {
            setInserting(null);
        }
    };
    const toggleFolder = (folderId: string) => {
        setCollapsedFolders((current) => {
            const next = new Set(current);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };
    return (
        <>
            <header className="flex h-10 shrink-0 items-center border-b border-border px-3 text-sm font-medium">工作区</header>
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
                <Images className="size-4" />
                <strong className="text-sm">资产</strong>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
                <input
                    className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
                    aria-label="搜索资产名称或标签"
                    placeholder="请输入资产/标签名称进行搜索"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                />
                <Button size="small" onClick={onManage}>
                    管理素材
                </Button>
            </div>
            <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {!userId ? (
                    <p className="p-3 text-sm">登录后查看资产。</p>
                ) : query.isPending ? (
                    <p role="status" className="p-3 text-sm">
                        正在加载资产…
                    </p>
                ) : null}
                {query.isError ? (
                    <div role="alert" className="p-3 text-sm">
                        资产读取失败，已加载的内容仍保留。<Button onClick={() => void query.refetch()}>重试</Button>
                    </div>
                ) : null}
                {query.isSuccess && !assets.length && !displayFolders.length ? <WorkspaceState icon="canvas" compact title="没有匹配的资产" description="换个搜索条件试试。" /> : null}
                {assets.length || displayFolders.length ? <ProductAssetFolderContents folders={displayFolders} assetsByFolder={displayAssetsByFolder} collapsedFolders={collapsedFolders} onToggleFolder={toggleFolder} onInsert={insert} inserting={inserting} /> : null}
            </div>
        </>
    );
}

function ProductAssetFolderContents({
    folders,
    assetsByFolder,
    collapsedFolders,
    onToggleFolder,
    onInsert,
    inserting,
}: {
    folders: AssetFolder[];
    assetsByFolder: Map<string, Asset[]>;
    collapsedFolders: ReadonlySet<string>;
    onToggleFolder: (folderId: string) => void;
    onInsert: (asset: Asset) => void;
    inserting: string | null;
}) {
    const rootAssets = assetsByFolder.get("") || [];
    const rootFolders = folders.filter((folder) => !(folder.parentId || "")).sort((a, b) => a.position - b.position);
    return (
        <div className="space-y-1">
            {rootAssets.map((asset) => (
                <ProductAssetRow key={asset.id} asset={asset} onInsert={onInsert} inserting={inserting} depth={0} />
            ))}
            {rootFolders.map((folder) => (
                <section key={folder.id}>
                    <button type="button" className="flex w-full items-center gap-1 rounded-md px-2 py-2 text-left text-sm hover:bg-surface-hover" onClick={() => onToggleFolder(folder.id)} aria-expanded={!collapsedFolders.has(folder.id)}>
                        {collapsedFolders.has(folder.id) ? <ChevronRight className="size-3 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-3 shrink-0 text-muted-foreground" />}
                        <img src={folderIcon} alt="" className="h-7 w-[34px] shrink-0 object-contain" draggable={false} />
                        <span className="truncate">{folder.name}</span>
                    </button>
                    {!collapsedFolders.has(folder.id) ? (assetsByFolder.get(folder.id) || []).map((asset) => <ProductAssetRow key={asset.id} asset={asset} onInsert={onInsert} inserting={inserting} depth={1} />) : null}
                </section>
            ))}
        </div>
    );
}

function ProductAssetRow({ asset, onInsert, inserting, depth }: { asset: Asset; onInsert: (asset: Asset) => void; inserting: string | null; depth: number }) {
    const insertable = ["image", "video", "audio", "text"].includes(asset.kind);
    const cover = asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "");
    return (
        <div className="group flex items-center gap-2 rounded-md py-2 pr-1 hover:bg-surface-hover" style={{ paddingLeft: `${8 + depth * 24}px` }}>
            <div className="relative grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[#242424]">
                {asset.kind === "audio" ? (
                    <img src={audioAssetImage} alt="" className="h-full w-full object-contain" draggable={false} />
                ) : (
                    <CachedResourceImage src={cover} storageKey={asset.kind === "image" ? asset.data.storageKey : undefined} alt="" className="h-full w-full object-cover" fallback={<FileText className="size-4 text-muted-foreground" />} />
                )}
                {asset.kind === "video" ? <img src={videoPlayIcon} alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[18px] w-4 -translate-x-1/2 -translate-y-1/2 object-contain" draggable={false} /> : null}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm" title={asset.title}>
                    {asset.title}
                </div>
                {/* <div className="truncate text-xs text-muted-foreground">
                    {resourceStorageLabel("storageKey" in asset.data ? asset.data.storageKey : undefined)}
                    {asset.tags?.length ? ` · ${asset.tags[0]}` : ""}
                </div> */}
            </div>
            <Button
                type="text"
                size="small"
                aria-label={`插入画布：${asset.title}`}
                title={insertable ? "插入画布" : "此类型请在素材库中查看"}
                disabled={!insertable || Boolean(inserting)}
                loading={inserting === asset.id}
                icon={<Plus className="size-4" />}
                onClick={() => onInsert(asset)}
            />
        </div>
    );
}
