import { CollectionToolbar } from "@/components/layout/collection-toolbar";
import { assetGridCardMinWidth, assetGridDensityOptions, parseAssetGridDensity, type AssetGridDensity } from "./asset-grid-density";
import { DeleteButton } from "@/components/ui/base/buttons/delete-button";
import {
    AlertTriangle,
    AudioLines,
    Box,
    CheckCheck,
    Clapperboard,
    Copy,
    Download,
    FileText,
    FileUp,
    FolderOpen,
    FolderPlus,
    Image as ImageIcon,
    Images,
    LayoutGrid,
    Link2,
    Maximize2,
    MoreHorizontal,
    PencilLine,
    Play,
    Plus,
    RotateCcw,
    Search,
    Tags,
    Trash2,
    Upload,
    ZoomIn,
    ZoomOut,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Drawer, Dropdown, Form, Input, Modal, Popconfirm, Progress, Space, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router";

import { AssetMediaPreview } from "@/components/asset-media-preview";
import { AssetLibraryCard, AssetLibraryCardMedia } from "@/components/assets/asset-library-card";
import { Switch } from "@/components/ui/base/switch";
import { cn } from "@/lib/utils";

import { useCopyText } from "@/hooks/use-copy-text";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ASSET_CATEGORY_OPTIONS, assetCategoryLabel } from "@/lib/asset-category";
import { resourceStorageLabel, resourceStorageLocation, resourceStorageTitle } from "@/lib/canvas/resource-storage-status";
import { formatBytes, readFileAsDataUrl, readImageMeta } from "@/lib/image-utils";
import { uploadImage } from "@/services/image-storage";
import { uploadMediaFile } from "@/services/file-storage";
import { downloadBrowserMedia } from "@/services/browser-download";
import { flushAssetStorePersistence, useAssetStore, type Asset, type AssetCategory, type AssetKind, type ImageAsset } from "@/stores/use-asset-store";
import { exportAssets, readAssetPackage } from "./asset-transfer";
import { AssetStorageUsage, assetStorageUsageQueryKey } from "./asset-storage-usage";
import { deleteAssetWithRemoteSync, deleteAssetsWithRemoteSync, loadAssetLibraryPage, loadAssetsForUse, localSavedRemotePendingMessage, saveRemoteUserDataNow } from "@/services/user-data-sync";
import { useUserStore } from "@/stores/use-user-store";
import { createAssetFolder, deleteAssetFolder, listAssetFolders, listRemoteAssetsPage, moveRemoteAssetsToFolder, updateAssetFolder, type AssetFolder } from "@/services/api/user-data";
import { AssetBatchUploadModal } from "./asset-batch-upload-modal";
import { AssetPreviewModal } from "./asset-image-preview-modal";
import { useAppearanceStore } from "@/stores/use-appearance-store";
import { Select } from "@/components/ui/base/select";
import { AppModal } from "@/components/ui/product/app-modal";
import { ProductBlackSelect } from "@/components/ui/product/product-black-select";
import selectArrowIcon from "@/assets/product-assets/select-arrow.svg";
import { AssetHistoryMedia, AssetHistoryPage, groupAssetsByDate } from "./asset-history-page";
import { PersonalAssetsPage, PersonalAssetsTagModal } from "./personal-assets-page";
import { ProductAssetsShell } from "./product-assets-shell";
import type { AssetSection, HistoryKind, LibraryAsset } from "./asset-view-types";

type AssetFormValues = {
    kind: AssetKind;
    category: AssetCategory;
    folderId?: string;
    title: string;
    coverUrl: string;
    tags: string[];
    source?: string;
    note?: string;
    content?: string;
    arkAssetId?: string;
    portraitCertified?: boolean;
};

type ImageDraft = ImageAsset["data"] | null;

const kindOptions = [
    { label: "全部", value: "all" },
    { label: "文本", value: "text" },
    { label: "图片", value: "image" },
    { label: "视频", value: "video" },
    { label: "音频", value: "audio" },
    { label: "3D 模型", value: "model" },
];

const categoryOptions = [{ label: "全部分类", value: "all" }, ...ASSET_CATEGORY_OPTIONS];
const ASSET_LIBRARY_QUERY_KEY = ["asset-library"] as const;
const ASSET_FOLDER_QUERY_KEY = ["asset-folders"] as const;
const ASSET_GRID_DENSITY_KEY = "infinite-canvas:asset-grid-density";
type AssetFolderFilter = "all" | "uncategorized" | string;

const assetKindIcons: Record<LibraryAsset["kind"], LucideIcon> = {
    text: FileText,
    image: ImageIcon,
    video: Clapperboard,
    audio: AudioLines,
    model: Box,
};

export default function AssetsPage() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const copyText = useCopyText();
    const [form] = Form.useForm<AssetFormValues>();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const assetInputRef = useRef<HTMLInputElement>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);
    const assets = useAssetStore((state) => state.assets);
    const addAsset = useAssetStore((state) => state.addAsset);

    const updateAsset = useAssetStore((state) => state.updateAsset);
    const user = useUserStore((state) => state.user);
    const userId = user?.id || "";
    const retentionDays = useUserStore((state) => state.runtimeLimits.recycleBinRetentionDays ?? 30);
    const [viewMode, setViewMode] = useState<"library" | "trash">("library");
    const [assetSection, setAssetSection] = useState<AssetSection>("history");
    const [historyKind, setHistoryKind] = useState<HistoryKind>("all");
    const [keyword, setKeyword] = useState("");
    const [kindFilter, setKindFilter] = useState<AssetKind | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");
    const [folderFilter, setFolderFilter] = useState<AssetFolderFilter>("all");
    const [tagFilters, setTagFilters] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(40);
    const [gridDensity, setGridDensity] = useState<AssetGridDensity>(readAssetGridDensity);
    const [editingAsset, setEditingAsset] = useState<LibraryAsset | null>(null);
    const [isAssetOpen, setIsAssetOpen] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<LibraryAsset | null>(null);
    const [deletingAsset, setDeletingAsset] = useState<LibraryAsset | null>(null);
    const [archivingAsset, setArchivingAsset] = useState<LibraryAsset | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
    const [batchArchiveOpen, setBatchArchiveOpen] = useState(false);
    const [batchUploadOpen, setBatchUploadOpen] = useState(false);
    const [saveAssetsOpen, setSaveAssetsOpen] = useState(false);
    const [saveAssetsSaving, setSaveAssetsSaving] = useState(false);
    const [saveAssetName, setSaveAssetName] = useState("");
    const [saveAssetFolderId, setSaveAssetFolderId] = useState("");
    const [saveAssetTags, setSaveAssetTags] = useState<string[]>([]);
    const [folderEditor, setFolderEditor] = useState<AssetFolder | "new" | null>(null);
    const [deletingFolder, setDeletingFolder] = useState<AssetFolder | null>(null);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderSaving, setFolderSaving] = useState(false);

    const [formKind, setFormKind] = useState<AssetKind>("text");
    const [imageDraft, setImageDraft] = useState<ImageDraft>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState<{ phase: "uploading" | "confirming"; percent?: number } | null>(null);
    const coverUrl = Form.useWatch("coverUrl", form) || "";
    const title = Form.useWatch("title", form) || "";
    const tags = Form.useWatch("tags", form) || [];
    const content = Form.useWatch("content", form) || "";
    const debouncedKeyword = useDebouncedValue(keyword.trim(), 250);

    const foldersQuery = useQuery({
        queryKey: ASSET_FOLDER_QUERY_KEY,
        queryFn: () => listAssetFolders(),
        enabled: Boolean(userId),
    });
    const folders = foldersQuery.data?.folders || [];

    const allLibraryAssets = useMemo(() => assets.filter((asset): asset is LibraryAsset => asset.kind !== "entity"), [assets]);
    const activeAssets = useMemo(() => allLibraryAssets.filter((asset) => asset.status !== "archived"), [allLibraryAssets]);
    const knownAssetTags = useMemo(() => Array.from(new Set(activeAssets.flatMap((asset) => asset.tags || []))).sort((left, right) => left.localeCompare(right, "zh-CN")), [activeAssets]);
    const trashAssets = useMemo(() => allLibraryAssets.filter((asset) => asset.status === "archived"), [allLibraryAssets]);
    const validAssets = viewMode === "trash" ? trashAssets : activeAssets;
    const filteredAssets = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        return validAssets.filter((asset) => {
            if (kindFilter !== "all" && asset.kind !== kindFilter) return false;
            if (categoryFilter !== "all" && (asset.category || "other") !== categoryFilter) return false;
            if (folderFilter === "uncategorized" && asset.folderId) return false;
            if (folderFilter !== "all" && folderFilter !== "uncategorized" && asset.folderId !== folderFilter) return false;
            if (tagFilters.length > 0 && !tagFilters.every((tag) => asset.tags?.includes(tag))) return false;
            if (!query) return true;
            return assetSearchText(asset).includes(query);
        });
    }, [validAssets, keyword, kindFilter, categoryFilter, folderFilter, tagFilters]);

    const assetPageQuery = useQuery({
        queryKey: [...ASSET_LIBRARY_QUERY_KEY, page, pageSize, viewMode, kindFilter, categoryFilter, folderFilter, debouncedKeyword],
        queryFn: ({ signal }) =>
            loadAssetLibraryPage({
                page,
                pageSize,
                status: viewMode === "trash" ? "archived" : "active",
                kind: kindFilter === "all" ? undefined : kindFilter,
                category: categoryFilter === "all" ? undefined : categoryFilter,
                folderId: folderFilter !== "all" && folderFilter !== "uncategorized" ? folderFilter : undefined,
                uncategorized: folderFilter === "uncategorized",
                query: debouncedKeyword || undefined,
                signal,
            }),
        enabled: Boolean(userId),
        placeholderData: keepPreviousData,
    });

    const localVisibleAssets = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAssets.slice(start, start + pageSize);
    }, [filteredAssets, page, pageSize]);
    // 远端成功且本页有可展示素材时用远端。真正的空结果保持空页。
    // 仅在「远端空、本地仍有筛选结果」或「远端总数>0 但本页全是被排除的 entity」时回退本地。
    const remotePageAssets = useMemo(() => (assetPageQuery.data?.assets || []).filter((asset): asset is LibraryAsset => asset.kind !== "entity"), [assetPageQuery.data?.assets]);
    const remoteTotal = assetPageQuery.data?.total ?? 0;
    const remoteReady = assetPageQuery.isSuccess && assetPageQuery.data !== undefined;
    const preferLocalUnsynced = remoteReady && remoteTotal === 0 && localVisibleAssets.length > 0;
    const remoteEntityOnlyPage = remoteReady && remotePageAssets.length === 0 && remoteTotal > 0;
    const useRemotePage = tagFilters.length === 0 && remoteReady && !preferLocalUnsynced && !remoteEntityOnlyPage && (remotePageAssets.length > 0 || remoteTotal === 0);
    const visibleAssets = useMemo(() => (useRemotePage ? remotePageAssets : localVisibleAssets), [useRemotePage, remotePageAssets, localVisibleAssets]);
    const generationAssets = useMemo(() => {
        const combined = new Map(activeAssets.map((asset) => [asset.id, asset]));
        remotePageAssets.forEach((asset) => combined.set(asset.id, asset));
        return Array.from(combined.values()).filter((asset) => asset.kind === "image" || asset.kind === "video" || asset.kind === "audio");
    }, [activeAssets, remotePageAssets]);
    const historyAssets = useMemo(() => generationAssets.filter((asset) => historyKind === "all" || asset.kind === historyKind), [generationAssets, historyKind]);
    const historyGroups = useMemo(() => groupAssetsByDate(historyAssets), [historyAssets]);
    const historyCounts = useMemo(
        () => ({
            all: generationAssets.length,
            image: generationAssets.filter((asset) => asset.kind === "image").length,
            video: generationAssets.filter((asset) => asset.kind === "video").length,
            audio: generationAssets.filter((asset) => asset.kind === "audio").length,
        }),
        [generationAssets],
    );
    const selectedAssets = useMemo(() => {
        if (viewMode === "trash") return trashAssets.filter((asset) => selectedIds.includes(asset.id));
        const combined = new Map(activeAssets.map((asset) => [asset.id, asset]));
        remotePageAssets.forEach((asset) => combined.set(asset.id, asset));
        return Array.from(combined.values()).filter((asset) => selectedIds.includes(asset.id));
    }, [activeAssets, remotePageAssets, selectedIds, trashAssets, viewMode]);
    const previewMediaAsset = previewAsset && (previewAsset.kind === "image" || previewAsset.kind === "video" || previewAsset.kind === "audio") ? previewAsset : null;
    const visibleAssetIds = useMemo(() => visibleAssets.map((asset) => asset.id), [visibleAssets]);
    const allFilteredSelected = visibleAssetIds.length > 0 && visibleAssetIds.every((id) => selectedIds.includes(id));
    const totalAssets = useRemotePage ? remoteTotal : filteredAssets.length;
    const kindCounts = useMemo(
        () => assetCountMap(kindOptions, useRemotePage ? assetPageQuery.data?.kindCounts : undefined, viewMode === "trash" ? trashAssets : activeAssets, (asset) => asset.kind),
        [activeAssets, assetPageQuery.data?.kindCounts, trashAssets, useRemotePage, viewMode],
    );
    const categoryCounts = useMemo(
        () => assetCountMap(categoryOptions, useRemotePage ? assetPageQuery.data?.categoryCounts : undefined, viewMode === "trash" ? trashAssets : activeAssets, (asset) => asset.category || "other"),
        [activeAssets, assetPageQuery.data?.categoryCounts, trashAssets, useRemotePage, viewMode],
    );
    const folderCounts = assetPageQuery.data?.folderCounts || {};

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalAssets / pageSize));
        setPage((value) => Math.min(value, maxPage));
    }, [pageSize, totalAssets]);

    useEffect(() => {
        window.localStorage.setItem(ASSET_GRID_DENSITY_KEY, String(gridDensity));
    }, [gridDensity]);

    useEffect(() => {
        const existingIds = new Set([...validAssets, ...(viewMode === "library" ? remotePageAssets : [])].map((asset) => asset.id));
        setSelectedIds((current) => current.filter((id) => existingIds.has(id)));
    }, [remotePageAssets, validAssets, viewMode]);

    const folderSelectOptions = useMemo(() => [{ label: "未分类", value: "" }, ...folders.map((folder) => ({ label: folder.name, value: folder.id }))], [folders]);

    const invalidateAssetLibrary = async () => {
        await Promise.all([queryClient.invalidateQueries({ queryKey: ASSET_LIBRARY_QUERY_KEY }), queryClient.invalidateQueries({ queryKey: ASSET_FOLDER_QUERY_KEY })]);
    };

    const saveFolder = async () => {
        const name = folderName.trim();
        if (!name || !folderEditor) return;
        setFolderSaving(true);
        try {
            if (folderEditor === "new") await createAssetFolder(name);
            else await updateAssetFolder(folderEditor.id, name);
            setFolderEditor(null);
            setFolderName("");
            await invalidateAssetLibrary();
            message.success(folderEditor === "new" ? "素材分类已创建" : "素材分类已重命名");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材分类保存失败");
        } finally {
            setFolderSaving(false);
        }
    };

    const removeFolder = async (folder: AssetFolder) => {
        try {
            await deleteAssetFolder(folder.id);
            for (const asset of useAssetStore.getState().assets) {
                if (asset.folderId === folder.id) updateAsset(asset.id, { folderId: undefined });
            }
            await flushAssetStorePersistence();
            if (folderFilter === folder.id) setFolderFilter("all");
            setPage(1);
            await invalidateAssetLibrary();
            message.success(`已删除分类「${folder.name}」，其中素材已移至未分类`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材分类删除失败");
            throw error;
        }
    };

    const moveAssetsToFolder = async (assetIds: string[], folderId: string) => {
        if (!assetIds.length) return;
        try {
            await moveRemoteAssetsToFolder(assetIds, folderId);
            assetIds.forEach((id) => updateAsset(id, { folderId: folderId || undefined }));
            await flushAssetStorePersistence();
            setSelectedIds([]);
            await invalidateAssetLibrary();
            message.success(`已移动 ${assetIds.length} 个素材`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "移动素材失败");
        }
    };

    const openCreate = () => {
        setEditingAsset(null);
        setImageDraft(null);
        setImageFile(null);
        setImageUploading(false);
        setImageUploadProgress(null);
        setFormKind("text");
        form.setFieldsValue({
            kind: "text",
            category: "other",
            folderId: folderFilter !== "all" && folderFilter !== "uncategorized" ? folderFilter : "",
            title: "",
            coverUrl: "",
            tags: [],
            source: "手动添加",
            note: "",
            content: "",
            arkAssetId: "",
            portraitCertified: false,
        });
        setIsAssetOpen(true);
    };

    const renameAsset = async (asset: LibraryAsset, title: string) => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle || normalizedTitle === asset.title) return true;
        try {
            if (!useAssetStore.getState().assets.some((item) => item.id === asset.id)) {
                await loadAssetsForUse([asset.id]);
            }
            updateAsset(asset.id, { title: normalizedTitle });
            await flushAssetStorePersistence();
            try {
                await saveRemoteUserDataNow();
                await invalidateAssetLibrary();
                message.success("素材已重命名");
            } catch (error) {
                message.warning(localSavedRemotePendingMessage("素材已在本地重命名", error));
            }
            return true;
        } catch (error) {
            message.error(error instanceof Error ? error.message : "重命名失败");
            return false;
        }
    };

    const ensureAssetsInStore = async (assetIds: string[]) => {
        const missingIds = assetIds.filter((id) => !useAssetStore.getState().assets.some((asset) => asset.id === id));
        if (missingIds.length) await loadAssetsForUse(missingIds);
    };

    const saveAsset = async () => {
        const values = await form.validateFields();
        let imageData = imageDraft;
        if (values.kind === "image" && imageFile) {
            setImageUploading(true);
            setImageUploadProgress({ phase: "uploading", percent: 0 });
            try {
                const image = await uploadImage(imageFile);
                setImageUploadProgress({ phase: "confirming" });
                imageData = { dataUrl: image.url, storageKey: image.storageKey, width: image.width, height: image.height, bytes: image.bytes, mimeType: image.mimeType };
                setImageDraft(imageData);
                setImageFile(null);
                void queryClient.invalidateQueries({ queryKey: assetStorageUsageQueryKey });
            } catch (error) {
                message.error(error instanceof Error ? error.message : "图片上传失败，请重试");
                return;
            } finally {
                setImageUploading(false);
                setImageUploadProgress(null);
            }
        }

        const base = {
            title: values.title.trim(),
            category: values.category,
            folderId: values.folderId || undefined,
            status: editingAsset?.status || ("confirmed" as const),
            primaryVersionId: editingAsset?.primaryVersionId,
            coverUrl: values.coverUrl?.trim() || (values.kind === "image" && imageData ? imageData.dataUrl : ""),
            tags: values.tags || [],
            source: values.source?.trim(),
            note: values.note?.trim(),
            arkAssetId: values.arkAssetId?.trim() || undefined,
            portraitCertified: values.portraitCertified || undefined,
            metadata: editingAsset?.metadata || { source: "manual" },
        };

        if (values.kind === "text") {
            const asset = { ...base, kind: "text" as const, data: { content: (values.content || "").trim() } };
            editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
        } else {
            if (!imageData) {
                message.error("请选择图片文件");
                return;
            }
            const asset = { ...base, kind: "image" as const, data: imageData };
            editingAsset ? updateAsset(editingAsset.id, asset) : addAsset(asset);
        }

        await flushAssetStorePersistence();
        try {
            await saveRemoteUserDataNow();
            await invalidateAssetLibrary();
            message.success(editingAsset ? "素材已更新" : "素材已保存");
        } catch (error) {
            message.warning(localSavedRemotePendingMessage(editingAsset ? "素材已在本地更新" : "素材已在本地保存", error));
        }
        setIsAssetOpen(false);
    };

    const readCoverFile = async (file?: File) => {
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        form.setFieldValue("coverUrl", dataUrl);
    };

    const readImageFile = async (file?: File) => {
        if (!file || !file.type.startsWith("image/") || imageUploading) return;
        try {
            const dataUrl = await readFileAsDataUrl(file);
            const meta = await readImageMeta(dataUrl);
            setImageFile(file);
            const draft = { dataUrl, storageKey: "", width: meta.width, height: meta.height, bytes: file.size, mimeType: file.type || meta.mimeType };
            setImageDraft(draft);
            if (!form.getFieldValue("coverUrl")) form.setFieldValue("coverUrl", dataUrl);
            if (!form.getFieldValue("title")) form.setFieldValue("title", file.name);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取图片失败，请重试");
        }
    };

    const readModelFile = async (file?: File) => {
        if (!file || !/\.(glb|gltf)$/i.test(file.name)) return;
        const uploaded = await uploadMediaFile(file, "model");
        void queryClient.invalidateQueries({ queryKey: assetStorageUsageQueryKey });
        addAsset({
            kind: "model",
            title: file.name.replace(/\.(glb|gltf)$/i, ""),
            coverUrl: "",
            tags: ["3D模型"],
            source: "手动上传",
            data: { url: uploaded.url, storageKey: uploaded.storageKey, bytes: uploaded.bytes, mimeType: uploaded.mimeType, fileName: file.name },
            metadata: { source: "manual" },
        });
        // 直传失败时文件只落在本机，云端同步会重传；此时不能说成"已保存"。
        if (uploaded.pendingRemoteUpload) message.warning(`3D 模型已保存在本机，尚未上传到服务器${uploaded.remoteUploadError ? `：${uploaded.remoteUploadError}` : ""}`);
        else message.success("3D 模型已保存");
    };

    const copyAssetText = async (asset: LibraryAsset) => {
        if (asset.kind !== "text") return;
        copyText(asset.data.content, "文本已复制");
    };

    const downloadImage = async (asset: LibraryAsset) => {
        if (asset.kind !== "image" && asset.kind !== "video" && asset.kind !== "audio" && asset.kind !== "model") return;
        const url = asset.kind === "image" ? asset.data.dataUrl : asset.data.url;
        const extension = asset.kind === "model" ? asset.data.fileName.split(".").pop() || "glb" : asset.data.mimeType.split("/")[1] || "png";
        try {
            await downloadBrowserMedia({ storageKey: asset.data.storageKey, url, fileName: `${asset.title || "asset"}.${extension}` });
        } catch (error) {
            message.error(error instanceof Error ? error.message : "下载失败");
        }
    };

    const exportAllAssets = async () => {
        if (!validAssets.length) {
            message.warning("暂无素材可导出");
            return;
        }
        await exportAssets(validAssets);
    };

    const importAssetZip = async (file?: File) => {
        if (!file) return;
        try {
            const importedAssets = await readAssetPackage(file);
            importedAssets.forEach((asset) => {
                const payload = { ...asset } as Record<string, unknown>;
                delete payload.id;
                delete payload.createdAt;
                delete payload.updatedAt;
                addAsset(payload as Parameters<typeof addAsset>[0]);
            });
            message.success(`已导入 ${importedAssets.length} 个素材`);
        } catch {
            message.error("导入失败，请选择有效的素材压缩包");
        } finally {
            if (assetInputRef.current) assetInputRef.current.value = "";
        }
    };

    const restoreAsset = async (asset: LibraryAsset) => {
        try {
            await ensureAssetsInStore([asset.id]);
            updateAsset(asset.id, { status: "confirmed" });
            await flushAssetStorePersistence();
            await saveRemoteUserDataNow();
            message.success(`已还原素材「${asset.title}」`);
        } catch (error) {
            message.warning(localSavedRemotePendingMessage("已在本地还原", error));
        }
    };

    const batchRestore = async () => {
        if (!selectedIds.length) return;
        try {
            await ensureAssetsInStore(selectedIds);
            for (const id of selectedIds) updateAsset(id, { status: "confirmed" });
            const count = selectedIds.length;
            setSelectedIds([]);
            await flushAssetStorePersistence();
            await saveRemoteUserDataNow();
            message.success(`已还原 ${count} 个素材`);
        } catch (error) {
            message.warning(localSavedRemotePendingMessage("已在本地还原", error));
        }
    };

    const archiveAsset = async (asset: LibraryAsset) => {
        try {
            await ensureAssetsInStore([asset.id]);
            updateAsset(asset.id, { status: "archived" });
            await flushAssetStorePersistence();
            await saveRemoteUserDataNow();
            message.success(`已将「${asset.title}」移入回收站`);
        } catch (error) {
            message.warning(localSavedRemotePendingMessage("已移入回收站", error));
        }
    };

    const batchArchive = async () => {
        if (!selectedIds.length) return;
        try {
            await ensureAssetsInStore(selectedIds);
            for (const id of selectedIds) updateAsset(id, { status: "archived" });
            const count = selectedIds.length;
            setSelectedIds([]);
            await flushAssetStorePersistence();
            await saveRemoteUserDataNow();
            message.success(`已将 ${count} 个素材移入回收站`);
        } catch (error) {
            message.warning(localSavedRemotePendingMessage("已移入回收站", error));
        }
    };

    const emptyTrash = async () => {
        const count = trashAssets.length;
        if (!count) return;
        try {
            await deleteAssetsWithRemoteSync(trashAssets.map((asset) => asset.id));
            setSelectedIds([]);
            message.success(`已彻底清空回收站 ${count} 个素材`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "清空回收站失败");
        }
    };

    const confirmDelete = async () => {
        if (!deletingAsset) return;
        try {
            await deleteAssetWithRemoteSync(deletingAsset.id);
            message.success("素材已彻底删除");
            setDeletingAsset(null);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材删除失败");
        }
    };

    const exportSelectedAssets = async () => {
        if (!selectedAssets.length) return;
        await exportAssets(selectedAssets);
    };

    const openSaveAssets = () => {
        if (!selectedAssets.length) return;
        const singleAsset = selectedAssets.length === 1 ? selectedAssets[0] : null;
        setSaveAssetName("");
        setSaveAssetFolderId(singleAsset?.folderId || "");
        setSaveAssetTags(singleAsset?.tags || []);
        setSaveAssetsOpen(true);
    };

    const openSaveAsset = (asset: LibraryAsset) => {
        setSelectedIds([asset.id]);
        setSaveAssetName("");
        setSaveAssetFolderId(asset.folderId || "");
        setSaveAssetTags(asset.tags || []);
        setSaveAssetsOpen(true);
    };

    const saveSelectedAssets = async () => {
        if (!selectedAssets.length) return;
        const normalizedName = saveAssetName.trim();
        if (selectedAssets.length === 1 && !normalizedName) {
            message.warning("请输入资产名称");
            return;
        }
        setSaveAssetsSaving(true);
        let localSaved = false;
        try {
            await ensureAssetsInStore(selectedAssets.map((asset) => asset.id));
            selectedAssets.forEach((asset) => {
                updateAsset(asset.id, {
                    ...(selectedAssets.length === 1 ? { title: normalizedName } : {}),
                    folderId: saveAssetFolderId || undefined,
                    tags: saveAssetTags,
                    status: "confirmed",
                });
            });
            await flushAssetStorePersistence();
            localSaved = true;
            await saveRemoteUserDataNow();
            await invalidateAssetLibrary();
            const count = selectedAssets.length;
            setSelectedIds([]);
            setSaveAssetsOpen(false);
            message.success(count === 1 ? "资产已保存" : `已保存 ${count} 个资产`);
        } catch (error) {
            if (localSaved) {
                setSelectedIds([]);
                setSaveAssetsOpen(false);
                message.warning(localSavedRemotePendingMessage("资产已保存在本地", error));
            } else {
                message.error(error instanceof Error ? error.message : "资产保存失败");
            }
        } finally {
            setSaveAssetsSaving(false);
        }
    };

    const confirmBatchDelete = async () => {
        if (!selectedAssets.length) return;
        try {
            await deleteAssetsWithRemoteSync(selectedAssets.map((asset) => asset.id));
            message.success(`已彻底删除 ${selectedAssets.length} 个素材`);
            setSelectedIds([]);
            setBatchDeleteOpen(false);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "批量删除失败");
        }
    };

    return (
        <>
            <ProductAssetsShell
                section={assetSection}
                historyCount={historyCounts.all}
                libraryCount={activeAssets.length}
                onSectionChange={(section) => {
                    setAssetSection(section);
                    if (section === "history") setViewMode("library");
                    setSelectedIds([]);
                }}
            >
                {assetSection === "history" ? (
                    <AssetHistoryPage
                        groups={historyGroups}
                        counts={historyCounts}
                        kind={historyKind}
                        selectedIds={selectedIds}
                        onKindChange={(kind) => {
                            setHistoryKind(kind);
                            setSelectedIds([]);
                        }}
                        onOpen={setPreviewAsset}
                        onSelect={(assetId, selected) => setSelectedIds((current) => (selected ? [...new Set([...current, assetId])] : current.filter((id) => id !== assetId)))}
                        onClear={() => setSelectedIds([])}
                        onSaveAssets={openSaveAssets}
                        onDownload={() => void exportSelectedAssets()}
                        onDelete={() => setBatchArchiveOpen(true)}
                        onDownloadAsset={(asset) => void downloadImage(asset)}
                        onDeleteAsset={setArchivingAsset}
                    />
                ) : (
                    <PersonalAssetsPage
                        viewMode={viewMode}
                        folderFilter={folderFilter}
                        folders={folders}
                        folderCounts={folderCounts}
                        activeAssets={activeAssets}
                        visibleAssets={visibleAssets}
                        selectedIds={selectedIds}
                        selectedAssetCount={selectedAssets.length}
                        knownTags={knownAssetTags}
                        tagFilters={tagFilters}
                        keyword={keyword}
                        trashCount={trashAssets.length}
                        retentionDays={retentionDays}
                        folderOptions={folderSelectOptions}
                        page={page}
                        pageSize={pageSize}
                        totalAssets={totalAssets}
                        onBackToLibrary={() => {
                            setFolderFilter("all");
                            setPage(1);
                        }}
                        onTagFiltersChange={(value) => {
                            setTagFilters(value);
                            setPage(1);
                        }}
                        onKeywordChange={(value) => {
                            setKeyword(value);
                            setPage(1);
                        }}
                        onUpload={() => setBatchUploadOpen(true)}
                        onCreateFolder={() => {
                            setFolderName("");
                            setFolderEditor("new");
                        }}
                        onOpenTagManager={() => setTagManagerOpen(true)}
                        onEmptyTrash={() => void emptyTrash()}
                        onLeaveTrash={() => {
                            setViewMode("library");
                            setPage(1);
                            setSelectedIds([]);
                        }}
                        onOpenFolder={(folderId) => {
                            setFolderFilter(folderId);
                            setPage(1);
                        }}
                        onRenameFolder={(folder) => {
                            setFolderName(folder.name);
                            setFolderEditor(folder);
                        }}
                        onDeleteFolder={setDeletingFolder}
                        onSelectAsset={(assetId, selected) => setSelectedIds((current) => (selected ? [...new Set([...current, assetId])] : current.filter((id) => id !== assetId)))}
                        onOpenAsset={setPreviewAsset}
                        onRenameAsset={renameAsset}
                        onEditTags={(asset) => {
                            setSelectedIds([asset.id]);
                            setSaveAssetName(asset.title);
                            setSaveAssetFolderId(asset.folderId || "");
                            setSaveAssetTags(asset.tags || []);
                            setSaveAssetsOpen(true);
                        }}
                        onDownloadAsset={(asset) => void downloadImage(asset)}
                        onArchiveAsset={setArchivingAsset}
                        onRestoreAsset={(asset) => void restoreAsset(asset)}
                        onDeleteAsset={setDeletingAsset}
                        onMoveAssets={(assetIds, folderId) => void moveAssetsToFolder(assetIds, folderId)}
                        onPageChange={(nextPage, nextPageSize) => {
                            setPage(nextPageSize !== pageSize ? 1 : nextPage);
                            setPageSize(nextPageSize);
                        }}
                        onClearSelection={() => setSelectedIds([])}
                        onEditSelectedTags={openSaveAssets}
                        onDownloadSelected={() => void exportSelectedAssets()}
                        onRestoreSelected={() => void batchRestore()}
                        onDeleteSelected={() => (viewMode === "trash" ? setBatchDeleteOpen(true) : setBatchArchiveOpen(true))}
                    />
                )}
            </ProductAssetsShell>

            <Modal
                className="workspace-modal workspace-modal-wide library-modal"
                title={editingAsset ? "编辑素材" : "新增素材"}
                open={isAssetOpen}
                onCancel={() => {
                    if (!imageUploading) setIsAssetOpen(false);
                }}
                onOk={() => void saveAsset()}
                okText={imageUploading ? "正在上传" : "保存"}
                cancelText="取消"
                confirmLoading={imageUploading}
                cancelButtonProps={{ disabled: imageUploading }}
                closable={!imageUploading}
                destroyOnHidden
            >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <Form form={form} layout="vertical" requiredMark={false} initialValues={{ kind: "text", category: "other", tags: [] }}>
                        <Form.Item name="kind" label="类型">
                            <Select
                                options={[
                                    { label: "文本", value: "text" },
                                    { label: "图片", value: "image" },
                                ]}
                                onChange={(value) => setFormKind(value)}
                            />
                        </Form.Item>
                        <Form.Item name="category" label="业务分类">
                            <Select options={categoryOptions.slice(1)} />
                        </Form.Item>
                        <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
                            <Input placeholder="给素材起一个容易检索的名字" />
                        </Form.Item>
                        <Form.Item name="coverUrl" label="封面 URL">
                            <Space.Compact className="w-full">
                                <Input placeholder="可粘贴图片 URL，也可以上传本地封面" />
                                <Button icon={<Upload className="size-3.5" />} onClick={() => coverInputRef.current?.click()}>
                                    上传
                                </Button>
                            </Space.Compact>
                        </Form.Item>
                        <Form.Item name="tags" label="标签">
                            <Select mode="tags" tokenSeparators={[",", "，"]} placeholder="输入标签后回车" />
                        </Form.Item>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Form.Item name="arkAssetId" label="方舟素材 ID" rules={[{ pattern: /^asset-[A-Za-z0-9-]+$/, message: "请输入 asset- 开头的方舟素材 ID" }]}>
                                <Input autoComplete="off" allowClear placeholder="asset-…，需为本人或被授权可用的方舟素材" />
                            </Form.Item>
                            <Form.Item name="portraitCertified" label="人像认证" valuePropName="checked" extra="标记已通过火山方舟实人认证的真人人像素材">
                                <Switch aria-label="人像认证" />
                            </Form.Item>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Form.Item name="source" label="来源">
                                <Input placeholder="手动添加 / 画布 / 任务中心" />
                            </Form.Item>
                            <Form.Item name="note" label="备注">
                                <Input placeholder="可选" />
                            </Form.Item>
                        </div>
                        {formKind === "text" ? (
                            <Form.Item name="content" label="文本内容" rules={[{ required: true, message: "请输入文本内容" }]}>
                                <Input.TextArea rows={8} placeholder="保存提示词、说明文案、参考描述等文本素材" />
                            </Form.Item>
                        ) : (
                            <Form.Item label="图片内容" required>
                                <div className="rounded-lg border border-dashed border-stone-300 p-4 dark:border-stone-700">
                                    <Button disabled={imageUploading} icon={<Upload className="size-4" />} onClick={() => imageInputRef.current?.click()}>
                                        {imageUploading ? "正在上传图片" : "选择图片文件"}
                                    </Button>
                                    {imageFile ? (
                                        <Tag color="gold" className="ml-3">
                                            待保存上传
                                        </Tag>
                                    ) : null}
                                    {imageDraft ? (
                                        <Typography.Text type="secondary" className="ml-3 text-xs" title={resourceStorageTitle(imageDraft.storageKey)}>
                                            {imageDraft.width}x{imageDraft.height} · {formatBytes(imageDraft.bytes)} · {resourceStorageLabel(imageDraft.storageKey)}
                                        </Typography.Text>
                                    ) : (
                                        <Typography.Text type="secondary" className="ml-3 text-xs">
                                            未选择图片
                                        </Typography.Text>
                                    )}
                                </div>
                            </Form.Item>
                        )}
                    </Form>
                    <div className="lg:pl-4">
                        <Typography.Text strong className="text-xs">
                            预览
                        </Typography.Text>
                        <div className="mt-2 overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
                            {coverUrl || imageDraft?.dataUrl ? (
                                <div className={`asset-preview-uploading ${imageUploading ? "is-uploading" : ""}`}>
                                    <img src={coverUrl || imageDraft?.dataUrl} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                                    {imageUploading && imageUploadProgress ? (
                                        <div className="asset-preview-uploading-panel">
                                            <div className="asset-preview-uploading-copy">
                                                <span>{imageUploadProgress.phase === "confirming" ? "正在确认资源" : "正在上传到云端"}</span>
                                                {typeof imageUploadProgress.percent === "number" ? <strong>{imageUploadProgress.percent}%</strong> : null}
                                            </div>
                                            <Progress percent={imageUploadProgress.percent} showInfo={false} size="small" status="active" />
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 p-5 text-center text-sm text-stone-500 dark:bg-stone-900">{content || "暂无封面"}</div>
                            )}
                            <div className="bg-background p-3">
                                <Typography.Text strong ellipsis className="block">
                                    {title || "未命名素材"}
                                </Typography.Text>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {tags.length ? (
                                        tags.map((tag) => (
                                            <Tag key={tag} className="m-0">
                                                {tag}
                                            </Tag>
                                        ))
                                    ) : (
                                        <Tag className="m-0">未打标签</Tag>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        void readCoverFile(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        void readImageFile(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
            </Modal>

            <SaveAssetsModal
                open={saveAssetsOpen}
                assets={selectedAssets}
                folders={folderSelectOptions}
                knownTags={knownAssetTags}
                name={saveAssetName}
                folderId={saveAssetFolderId}
                tags={saveAssetTags}
                saving={saveAssetsSaving}
                onNameChange={setSaveAssetName}
                onFolderChange={setSaveAssetFolderId}
                onTagsChange={setSaveAssetTags}
                onCancel={() => {
                    if (!saveAssetsSaving) setSaveAssetsOpen(false);
                }}
                onSave={() => void saveSelectedAssets()}
            />

            <AssetPreviewModal
                asset={previewMediaAsset}
                creatorName={user?.displayName || user?.username || "当前用户"}
                onClose={() => setPreviewAsset(null)}
                onCopy={(text) => copyText(text, "生成信息已复制")}
                onSave={(asset) => openSaveAsset(asset)}
                onDownload={(asset) => void downloadImage(asset)}
                onDelete={(asset) => {
                    setPreviewAsset(null);
                    setArchivingAsset(asset);
                }}
            />
            <AssetDrawer asset={previewAsset && !previewMediaAsset ? previewAsset : null} onClose={() => setPreviewAsset(null)} onCopy={copyAssetText} onDownload={downloadImage} />

            <AssetBatchUploadModal
                open={batchUploadOpen}
                defaultFolderId={folderFilter !== "all" && folderFilter !== "uncategorized" ? folderFilter : ""}
                folders={folders}
                onClose={() => setBatchUploadOpen(false)}
                onComplete={async () => {
                    setBatchUploadOpen(false);
                    await invalidateAssetLibrary();
                }}
            />

            <Modal
                className="library-modal library-confirm-modal"
                title={folderEditor === "new" ? "新建分类" : "重命名分类"}
                open={Boolean(folderEditor)}
                confirmLoading={folderSaving}
                onCancel={() => {
                    if (!folderSaving) setFolderEditor(null);
                }}
                onOk={() => void saveFolder()}
                okText="保存"
                cancelText="取消"
            >
                <Input autoFocus value={folderName} maxLength={40} placeholder="例如：角色参考、场景灵感" onChange={(event) => setFolderName(event.target.value)} onPressEnter={() => void saveFolder()} />
            </Modal>
            <Modal
                className="library-modal library-confirm-modal"
                title="删除文件夹"
                open={Boolean(deletingFolder)}
                onCancel={() => setDeletingFolder(null)}
                onOk={() => {
                    if (!deletingFolder) return;
                    void removeFolder(deletingFolder).then(() => setDeletingFolder(null));
                }}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                删除「{deletingFolder?.name}」后，其中的资产会移至未分类，资产文件不会被删除。
            </Modal>
            <PersonalAssetsTagModal
                open={tagManagerOpen}
                tags={knownAssetTags}
                selectedTags={tagFilters}
                tagCounts={Object.fromEntries(knownAssetTags.map((tag) => [tag, activeAssets.filter((asset) => asset.tags?.includes(tag)).length]))}
                trashCount={trashAssets.length}
                onToggleTag={(tag) => setTagFilters((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))}
                onClose={() => setTagManagerOpen(false)}
                onCreateText={openCreate}
                onImportPackage={() => assetInputRef.current?.click()}
                onUploadModel={() => modelInputRef.current?.click()}
                onExportAll={() => void exportAllAssets()}
                onOpenTrash={() => {
                    setTagManagerOpen(false);
                    setViewMode("trash");
                    setFolderFilter("all");
                    setTagFilters([]);
                    setSelectedIds([]);
                    setPage(1);
                }}
            />

            <input ref={assetInputRef} type="file" accept="application/zip,.zip" className="hidden" onChange={(event) => void importAssetZip(event.target.files?.[0])} />
            <input
                ref={modelInputRef}
                type="file"
                accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                className="hidden"
                onChange={(event) => {
                    void readModelFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                }}
            />

            <Modal
                className="library-modal library-confirm-modal"
                title="移入回收站"
                open={Boolean(archivingAsset)}
                onCancel={() => setArchivingAsset(null)}
                onOk={() => {
                    if (archivingAsset) {
                        void archiveAsset(archivingAsset);
                        setArchivingAsset(null);
                    }
                }}
                okText="移入回收站"
                cancelText="取消"
            >
                确定将「{archivingAsset?.title}」移入回收站吗？移入后不会出现在正常素材库中，可在回收站随时还原。
            </Modal>
            <Modal
                className="library-modal library-confirm-modal"
                title="批量移入回收站"
                open={batchArchiveOpen}
                onCancel={() => setBatchArchiveOpen(false)}
                onOk={() => {
                    void batchArchive();
                    setBatchArchiveOpen(false);
                }}
                okText="移入回收站"
                cancelText="取消"
            >
                确定将已选择的 {selectedAssets.length} 个素材移入回收站吗？移入后可随时在回收站批量还原。
            </Modal>
            <Modal
                className="library-modal library-confirm-modal"
                title="彻底删除素材"
                open={Boolean(deletingAsset)}
                onCancel={() => setDeletingAsset(null)}
                onOk={() => void confirmDelete()}
                okText="彻底删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定彻底删除「{deletingAsset?.title}」吗？未被其他素材复用的服务器文件会直接释放，原画布或任务中的旧引用可能失效，操作不可恢复。
            </Modal>
            <Modal
                className="library-modal library-confirm-modal"
                title="批量彻底删除素材"
                open={batchDeleteOpen}
                onCancel={() => setBatchDeleteOpen(false)}
                onOk={() => void confirmBatchDelete()}
                okText="彻底删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定彻底删除已选择的 {selectedAssets.length} 个素材吗？未被其他素材复用的服务器文件会直接释放，原画布或任务中的旧引用可能失效，操作不可恢复。
            </Modal>
        </>
    );
}

function SaveAssetsModal({
    open,
    assets,
    folders,
    knownTags,
    name,
    folderId,
    tags,
    saving,
    onNameChange,
    onFolderChange,
    onTagsChange,
    onCancel,
    onSave,
}: {
    open: boolean;
    assets: LibraryAsset[];
    folders: Array<{ label: string; value: string }>;
    knownTags: string[];
    name: string;
    folderId: string;
    tags: string[];
    saving: boolean;
    onNameChange: (value: string) => void;
    onFolderChange: (value: string) => void;
    onTagsChange: (value: string[]) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    const multiple = assets.length > 1;
    const folderOptions: Array<{ label: ReactNode; value: string; disabled?: boolean }> = folders.length ? folders : [{ value: "__empty_folder__", label: <span className="asset-save-dialog__empty-option">暂无文件夹</span>, disabled: true }];
    return (
        <AppModal flush centered open={open} width={723} title={null} footer={null} closable={false} maskClosable={!saving} keyboard={!saving} onCancel={onCancel} rootClassName="asset-save-modal-root" className="asset-save-modal">
            <section className={cn("asset-save-dialog", multiple && "is-multiple")} aria-label="保存资产">
                <header className="asset-save-dialog__header">
                    <h2>保存资产</h2>
                    <button type="button" aria-label="关闭保存资产弹窗" disabled={saving} onClick={onCancel}>
                        ×
                    </button>
                </header>
                <div className="asset-save-dialog__body">
                    <div className={cn("asset-save-dialog__previews", assets.length > 1 && "asset-save-dialog__previews__more")}>
                        {assets.map((asset) => (
                            <figure key={asset.id} className="asset-save-dialog__preview">
                                <div>
                                    <AssetHistoryMedia asset={asset} />
                                </div>
                                <figcaption>{asset.title || "未命名素材"}</figcaption>
                            </figure>
                        ))}
                    </div>
                    <div className="asset-save-dialog__fields">
                        {!multiple ? (
                            <div className="flex flex-col mb-2">
                                <label className="asset-save-dialog__field mb-2 asset-save-dialog__field is-required">
                                    <span className="text-[#FA5151]">
                                        *<span className="text-[#818181]">资产名称</span>
                                    </span>
                                </label>
                                    <input className="bg-[#373737] px-1.5 py-1.5 outline-0 rounded-[8px]" value={name} maxLength={80} autoFocus placeholder="请输入资产名称" onChange={(event) => onNameChange(event.target.value)} />
                            </div>
                        ) : null}
                        <div className="asset-save-dialog__field">
                            <span className="text-[#818181] mb-2">所属文件夹</span>
                            <ProductBlackSelect
                                aria-label="所属文件夹"
                                size="small"
                                value={folderId || undefined}
                                options={folderOptions}
                                popupMatchSelectWidth={false}
                                virtual={false}
                                placeholder="请选择所属文件夹"
                                notFoundContent={null}
                                suffixIcon={<img src={selectArrowIcon} alt="" />}
                                className="asset-save-dialog__select bg-[#373737]! mt-2! mb-2! w-full!"
                                popupClassName="asset-save-dialog__popup"
                                getPopupContainer={() => document.body}
                                onChange={(value) => onFolderChange(typeof value === "string" ? value : "")}
                            />
                        </div>
                        <div className="asset-save-dialog__field">
                            <span className="text-[#818181]">设置标签</span>
                            <ProductBlackSelect
                                aria-label="设置标签"
                                size="small"
                                mode="tags"
                                value={tags}
                                options={knownTags.map((tag) => ({ label: tag, value: tag }))}
                                popupMatchSelectWidth={false}
                                virtual={false}
                                tokenSeparators={[",", "，"]}
                                placeholder="请选择标签"
                                notFoundContent={<span className="asset-save-dialog__empty-option">输入标签后按回车创建</span>}
                                suffixIcon={<img src={selectArrowIcon} alt="" />}
                                className="asset-save-dialog__select mt-2! bg-[#373737]! w-full!"
                                popupClassName="asset-save-dialog__popup"
                                getPopupContainer={() => document.body}
                                onChange={(value) => onTagsChange(value)}
                            />
                        </div>
                    </div>
                    <footer className="asset-save-dialog__footer">
                        {multiple ? <span>已选择素材：{assets.length}</span> : <span />}
                        <div>
                            <button type="button" disabled={saving} onClick={onCancel}>
                                取消
                            </button>
                            <button type="button" className="is-primary" disabled={saving} onClick={onSave}>
                                {saving ? "保存中" : "保存"}
                            </button>
                        </div>
                    </footer>
                </div>
            </section>
        </AppModal>
    );
}

function formatExpirationHint(updatedAt: string, retentionDays: number) {
    if (!retentionDays || retentionDays <= 0) return "永久保留";
    const updatedTime = new Date(updatedAt).getTime();
    if (!Number.isFinite(updatedTime)) return `保留 ${retentionDays} 天`;
    const expireTime = updatedTime + retentionDays * 24 * 60 * 60 * 1000;
    const remainingMs = expireTime - Date.now();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    if (remainingDays <= 0) return "即将彻底清除";
    if (remainingDays === 1) return "剩余 1 天过期";
    return `剩余 ${remainingDays} 天过期`;
}

function formatExpirationDate(updatedAt: string, retentionDays: number) {
    if (!retentionDays || retentionDays <= 0) return "永久保留";
    const updatedTime = new Date(updatedAt).getTime();
    if (!Number.isFinite(updatedTime)) return "";
    const expireDate = new Date(updatedTime + retentionDays * 24 * 60 * 60 * 1000);
    return `预计于 ${expireDate.getFullYear()}-${String(expireDate.getMonth() + 1).padStart(2, "0")}-${String(expireDate.getDate()).padStart(2, "0")} 彻底清除`;
}

function isKnownAssetKind(kind: unknown): kind is AssetKind {
    return kind === "image" || kind === "video" || kind === "audio" || kind === "model" || kind === "text";
}

function AssetCover({ asset, selected, isTrash = false, onSelect, onOpen, menuItems }: { asset: LibraryAsset; selected: boolean; isTrash?: boolean; onSelect: (selected: boolean) => void; onOpen: () => void; menuItems: MenuProps["items"] }) {
    const kind = isKnownAssetKind(asset.kind) ? asset.kind : undefined;
    const KindIcon = kind ? assetKindIcons[kind] : FileText;
    const clock = asset.kind === "video" || asset.kind === "audio" ? formatAssetClock(asset.data.durationMs) : null;
    const showPlay = asset.kind === "video";
    const isLight = asset.kind === "audio" || asset.kind === "text" || asset.kind === "model";
    return (
        <AssetLibraryCardMedia className={isLight ? "assets-cover is-light" : "assets-cover"}>
            <button type="button" className="assets-cover-link" onClick={onOpen} aria-label={`查看素材：${asset.title}`}>
                {asset.kind === "audio" ? (
                    <AudioWaveCover asset={asset} />
                ) : asset.kind === "text" ? (
                    <TextCover asset={asset} />
                ) : asset.kind === "model" ? (
                    <ModelCover asset={asset} />
                ) : (
                    <AssetMediaPreview
                        asset={asset}
                        alt={asset.title}
                        className="assets-cover-media"
                        fallback={
                            <div className="assets-cover-fallback">
                                <KindIcon className="size-7" />
                            </div>
                        }
                    />
                )}
                <span className="assets-cover-vignette" aria-hidden="true" />
                {showPlay ? (
                    <span className="assets-cover-play">
                        <Play className="size-4" />
                    </span>
                ) : null}
            </button>
            <span className="assets-cover-badges">
                <span className="assets-cover-badge is-kind">
                    <KindIcon />
                    {kind ? assetKindLabel(kind) : "素材"}
                </span>
                {isTrash ? <span className="assets-cover-badge is-category !bg-amber-500/85 !text-white">回收站</span> : <span className="assets-cover-badge is-category">{assetCategoryLabel(asset.category)}</span>}
                {asset.portraitCertified ? <span className="assets-cover-badge is-category">人像认证</span> : null}
            </span>
            {clock ? <span className="assets-cover-clock">{clock}</span> : null}
            <input type="checkbox" checked={selected} onClick={(event) => event.stopPropagation()} onChange={(event) => onSelect(event.target.checked)} className="assets-select-check" aria-label={`选择 ${asset.title}`} />
            <Dropdown trigger={["click"]} menu={{ items: menuItems }}>
                <button type="button" className="assets-cover-more" aria-label="更多素材操作" title="更多操作">
                    <MoreHorizontal className="size-4" />
                </button>
            </Dropdown>
        </AssetLibraryCardMedia>
    );
}

function AudioWaveCover({ asset }: { asset: LibraryAsset & { kind: "audio" } }) {
    const bars = audioWaveBars(asset.id);
    return (
        <div className="assets-cover-wave" aria-hidden="true">
            {bars.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
            ))}
            <AudioLines className="assets-cover-wave-glyph" />
        </div>
    );
}

function TextCover({ asset }: { asset: LibraryAsset & { kind: "text" } }) {
    return (
        <div className="assets-cover-text">
            <p>{asset.data.content || "空白文本素材"}</p>
        </div>
    );
}

function ModelCover({ asset }: { asset: LibraryAsset & { kind: "model" } }) {
    return (
        <div className="assets-cover-model">
            <Box />
            <span>{asset.data.fileName}</span>
        </div>
    );
}

function AssetsBatchBar({
    count,
    isTrash = false,
    allSelected,
    onSelectAll,
    onClear,
    onExport,
    onRestore,
    onArchive,
    onDelete,
}: {
    count: number;
    isTrash?: boolean;
    allSelected: boolean;
    onSelectAll: () => void;
    onClear: () => void;
    onExport: () => void;
    onRestore?: () => void;
    onArchive?: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="assets-batch-bar" role="toolbar" aria-label="批量操作">
            <span className="assets-batch-count">
                已选择 <strong>{count}</strong> 个素材
            </span>
            <div className="assets-batch-actions">
                <Button size="small" icon={<CheckCheck className="size-3.5" />} disabled={allSelected} onClick={onSelectAll}>
                    全选
                </Button>
                <Button size="small" onClick={onClear}>
                    取消选择
                </Button>
                {isTrash ? (
                    <>
                        <Button size="small" type="primary" icon={<RotateCcw className="size-3.5" />} onClick={onRestore}>
                            还原已选
                        </Button>
                        <Button size="small" danger icon={<Trash2 className="size-3.5" />} onClick={onDelete}>
                            彻底删除已选
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="small" icon={<Download className="size-3.5" />} onClick={onExport}>
                            导出
                        </Button>
                        <Button size="small" icon={<Trash2 className="size-3.5 text-amber-500" />} onClick={onArchive}>
                            移入回收站
                        </Button>
                        <Button size="small" danger icon={<Trash2 className="size-3.5" />} onClick={onDelete}>
                            彻底删除
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

const assetsEmptyBannerFrames = [
    { src: "/short-drama-styles/retro-hong-kong.jpg", caption: "ASSET.01 · 天台重逢" },
    { src: "/short-drama-styles/cyberpunk-neon.jpg", caption: "ASSET.02 · 雨夜霓虹" },
    { src: "/short-drama-styles/suspense-noir.jpg", caption: "ASSET.03 · 暗巷追逐" },
];

function AssetsEmptyState({ onNew, onImport, onGoCanvas }: { onNew: () => void; onImport: () => void; onGoCanvas: () => void }) {
    const brandName = useAppearanceStore((state) => state.appearance.brandName);
    return (
        <div className="assets-empty">
            <div className="assets-empty-banner" aria-hidden="true">
                {assetsEmptyBannerFrames.map((frame, index) => (
                    <figure key={frame.caption} className={`assets-empty-banner-frame ${index === 1 ? "is-main" : index === 0 ? "is-back" : "is-front"}`}>
                        <img src={frame.src} alt="" loading="lazy" decoding="async" />
                        <span>{frame.caption}</span>
                    </figure>
                ))}
                <span className="assets-empty-banner-caption">
                    <span>{brandName}素材库</span>把每次创作的结果，留档成可复用的资产
                </span>
            </div>
            <div className="assets-empty-cards">
                <button type="button" className="assets-empty-card" onClick={onNew}>
                    <span className="assets-empty-card-icon">
                        <Plus />
                    </span>
                    <strong>新建素材</strong>
                    <span>录入提示词、说明文案，或上传图片资产。</span>
                </button>
                <button type="button" className="assets-empty-card" onClick={onImport}>
                    <span className="assets-empty-card-icon">
                        <FileUp />
                    </span>
                    <strong>导入素材包</strong>
                    <span>从素材压缩包一键恢复旧资产，继续创作。</span>
                </button>
                <button type="button" className="assets-empty-card" onClick={onGoCanvas}>
                    <span className="assets-empty-card-icon">
                        <Clapperboard />
                    </span>
                    <strong>去画布保存</strong>
                    <span>把画布上满意的镜头与画面留档进素材库。</span>
                </button>
            </div>
        </div>
    );
}

function AssetFilterGroup({
    title,
    options,
    value,
    counts,
    onChange,
    className = "",
}: {
    title: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    counts: Map<string, number>;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={`collection-filter-group ${className}`}>
            <span className="collection-filter-label">{title}</span>
            <div className="collection-filter-options">
                {options.map((option) => {
                    const active = value === option.value;
                    return (
                        <button key={option.value} type="button" aria-pressed={active} className={`assets-filter-item ${active ? "is-active" : ""}`} onClick={() => onChange(option.value)}>
                            <span className="assets-filter-item-label">{option.label}</span>
                            <span className="assets-filter-count">{counts.get(option.value) || 0}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function AssetDrawer({ asset, onClose, onCopy, onDownload }: { asset: LibraryAsset | null; onClose: () => void; onCopy: (asset: LibraryAsset) => void; onDownload: (asset: LibraryAsset) => void }) {
    const facts = asset ? assetArchiveFacts(asset) : [];
    const kind = asset && isKnownAssetKind(asset.kind) ? asset.kind : undefined;
    const KindIcon = asset ? (kind ? assetKindIcons[kind] : FileText) : Clapperboard;
    return (
        <Drawer className="library-drawer" title="素材档案" open={Boolean(asset)} size="large" onClose={onClose}>
            {asset ? (
                <div className="space-y-4">
                    <div className="asset-archive-header">
                        <span className="asset-archive-header-icon">
                            <KindIcon />
                        </span>
                        <div className="min-w-0">
                            <h2 className="asset-archive-title">{asset.title}</h2>
                            <p className="asset-archive-subtitle">
                                {assetCategoryLabel(asset.category)} · {formatAssetDateTime(asset.createdAt)} 创建
                            </p>
                        </div>
                    </div>
                    <div className="asset-archive-preview">
                        {asset.kind === "text" ? (
                            <div className="asset-archive-preview-note">{asset.data.content}</div>
                        ) : asset.kind === "audio" ? (
                            <div className="asset-archive-audio">
                                <audio src={asset.data.url} controls />
                            </div>
                        ) : asset.kind === "model" ? (
                            <div className="asset-archive-preview-model">
                                <Box />
                                <span>
                                    {asset.data.fileName} · {formatBytes(asset.data.bytes)}
                                </span>
                            </div>
                        ) : asset.kind === "video" ? (
                            <video src={asset.data.url} controls className="asset-archive-preview-media" />
                        ) : (
                            <AssetImageZoom asset={asset} />
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {(asset.tags || []).map((tag) => (
                            <Tag key={tag} className="m-0">
                                {tag}
                            </Tag>
                        ))}
                        {asset.arkAssetId ? (
                            <Tag className="m-0" color="geekblue" title="火山方舟素材 ID，生成视频时可直接 asset:// 引用">
                                方舟 {asset.arkAssetId}
                            </Tag>
                        ) : null}
                        <StorageTag asset={asset} />
                    </div>
                    <div className="asset-archive-facts">
                        {facts.map((fact) => (
                            <div key={fact.label} className="asset-archive-fact">
                                <span className="asset-archive-fact-label">{fact.label}</span>
                                <span className="asset-archive-fact-value" title={fact.value}>
                                    {fact.value}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="asset-archive-link">
                        <Link2 />
                        <span>所属项目</span>
                        <strong>{assetProjectLabel(asset)}</strong>
                    </div>
                    {asset.note ? (
                        <div className="asset-archive-section">
                            <span className="asset-archive-section-title">备注</span>
                            <p className="asset-archive-section-body">{asset.note}</p>
                        </div>
                    ) : null}
                    <div className="asset-archive-actions">
                        {asset.kind === "text" ? (
                            <Button type="primary" icon={<Copy className="size-4" />} onClick={() => onCopy(asset)}>
                                复制文本
                            </Button>
                        ) : null}
                        {asset.kind === "image" || asset.kind === "video" || asset.kind === "audio" || asset.kind === "model" ? (
                            <Button type="primary" icon={<Download className="size-4" />} onClick={() => onDownload(asset)}>
                                {assetDownloadLabel(asset)}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </Drawer>
    );
}

function AssetImageZoom({ asset }: { asset: LibraryAsset & { kind: "image" } }) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
    const reset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };
    return (
        <div
            className="asset-zoom-viewer"
            onWheel={(event) => {
                event.preventDefault();
                setScale((value) => Math.min(4, Math.max(0.25, value * (event.deltaY < 0 ? 1.12 : 0.89))));
            }}
            onPointerDown={(event) => {
                if (scale <= 1) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
            }}
            onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag) return;
                setOffset({ x: drag.ox + event.clientX - drag.x, y: drag.oy + event.clientY - drag.y });
            }}
            onPointerUp={() => {
                dragRef.current = null;
            }}
            onPointerCancel={() => {
                dragRef.current = null;
            }}
        >
            <img src={asset.coverUrl || asset.data.dataUrl} alt={asset.title} loading="lazy" decoding="async" className="asset-archive-preview-media asset-zoom-image" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
            <div className="asset-zoom-controls" data-canvas-no-zoom>
                <button type="button" title="缩小" aria-label="缩小" onClick={() => setScale((value) => Math.max(0.25, value / 1.25))}>
                    <ZoomOut className="size-4" />
                </button>
                <button type="button" title="恢复适应" aria-label="恢复适应" onClick={reset}>
                    {Math.round(scale * 100)}%
                </button>
                <button type="button" title="放大" aria-label="放大" onClick={() => setScale((value) => Math.min(4, value * 1.25))}>
                    <ZoomIn className="size-4" />
                </button>
                <button type="button" title="查看原图尺寸" aria-label="查看原图尺寸" onClick={() => setScale(1)}>
                    <Maximize2 className="size-4" />
                </button>
            </div>
        </div>
    );
}

function assetArchiveFacts(asset: LibraryAsset) {
    const facts: Array<{ label: string; value: string }> = [
        { label: "类型", value: assetKindLabel(asset.kind) },
        { label: "分类", value: assetCategoryLabel(asset.category) },
    ];
    if (asset.kind === "image" || asset.kind === "video") {
        facts.push({ label: "尺寸", value: assetSizeLabel(asset.data.width, asset.data.height) });
    }
    if (asset.kind === "video" || asset.kind === "audio") {
        facts.push({ label: "时长", value: formatAssetClock(asset.data.durationMs) || "未知" });
    }
    if (asset.kind !== "text") {
        facts.push({ label: "大小", value: formatBytes(asset.data.bytes) });
        facts.push({ label: "格式", value: asset.data.mimeType });
        facts.push({ label: "存储", value: resourceStorageLabel(asset.data.storageKey) });
    }
    facts.push({ label: "来源", value: asset.source || "未标注" });
    facts.push({ label: "创建", value: formatAssetDateTime(asset.createdAt) });
    facts.push({ label: "更新", value: formatAssetDateTime(asset.updatedAt) });
    return facts;
}

function assetSummary(asset: LibraryAsset) {
    if (asset.kind === "text") return asset.data.content;
    if (asset.kind === "audio") return `${formatAssetDuration(asset.data.durationMs)} · ${formatBytes(asset.data.bytes)} · ${asset.data.mimeType}`;
    if (asset.kind === "model") return `${asset.data.fileName} · ${formatBytes(asset.data.bytes)} · ${asset.data.mimeType}`;
    return `${assetSizeLabel(asset.data.width, asset.data.height)} · ${formatBytes(asset.data.bytes)} · ${asset.data.mimeType}`;
}

function assetSizeLabel(width: number, height: number) {
    return width > 0 && height > 0 ? `${width}x${height}` : "未知";
}

function StorageTag({ asset }: { asset: LibraryAsset }) {
    if (asset.kind !== "image" && asset.kind !== "video" && asset.kind !== "audio" && asset.kind !== "model") return null;
    const location = resourceStorageLocation(asset.data.storageKey);
    const color = location === "oss" ? "green" : location === "local" ? "gold" : "default";
    return (
        <Tag color={color} className="m-0 text-[var(--fs-label)]" title={resourceStorageTitle(asset.data.storageKey)}>
            {resourceStorageLabel(asset.data.storageKey)}
        </Tag>
    );
}

function assetSearchText(asset: LibraryAsset) {
    return [asset.title, asset.source || "", asset.note || "", assetCategoryLabel(asset.category), (asset.tags || []).join(" "), asset.kind === "text" ? asset.data.content : asset.data.mimeType].join(" ").toLowerCase();
}

function assetProjectLabel(asset: LibraryAsset) {
    const projectName = asset.metadata?.projectName;
    if (typeof projectName === "string" && projectName.trim()) return projectName;
    return Array.isArray(asset.metadata?.projectIds) && asset.metadata.projectIds.length ? "已关联项目" : "未关联项目";
}

function assetKindLabel(kind: AssetKind) {
    return kind === "image" ? "图片" : kind === "video" ? "视频" : kind === "audio" ? "音频" : kind === "model" ? "3D 模型" : "文本";
}

function assetDownloadLabel(asset: LibraryAsset) {
    if (asset.kind === "video") return "下载视频";
    if (asset.kind === "audio") return "下载音频";
    if (asset.kind === "model") return "下载模型";
    return "下载图片";
}

function readAssetGridDensity(): AssetGridDensity {
    if (typeof window === "undefined") return 8;
    return parseAssetGridDensity(window.localStorage.getItem(ASSET_GRID_DENSITY_KEY));
}

function assetCountMap<T extends { label: string; value: string }>(options: T[], remote: Record<string, number> | undefined, fallback: LibraryAsset[], valueOf: (asset: LibraryAsset) => string) {
    const result = new Map<string, number>();
    options.forEach((option) => {
        // 列表只展示 LibraryAsset（entity 角色卡被排除）；"全部"计数只能累加选项里声明的类型，
        // 否则远端 facets 里的 entity 会计入"全部"，出现计数 30 但列表为空的矛盾。
        if (remote) result.set(option.value, option.value === "all" ? options.reduce((sum, item) => (item.value === "all" ? sum : sum + (remote[item.value] || 0)), 0) : remote[option.value] || 0);
        else result.set(option.value, option.value === "all" ? fallback.length : fallback.filter((asset) => valueOf(asset) === option.value).length);
    });
    return result;
}

function formatAssetDuration(durationMs?: number) {
    if (!durationMs) return "时长未知";
    return `${Math.round(durationMs / 100) / 10} 秒`;
}

function formatAssetClock(durationMs?: number) {
    if (!durationMs || durationMs < 1000) return null;
    const total = Math.round(durationMs / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatAssetTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatAssetDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function audioWaveBars(seed: string) {
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const bars: number[] = [];
    for (let index = 0; index < 26; index += 1) {
        hash = (hash * 9301 + 49297) % 233280;
        const random = hash / 233280;
        const envelope = 0.35 + 0.65 * Math.abs(Math.sin(index * 0.55 + 1.2));
        bars.push(Math.round((0.18 + 0.82 * random * envelope) * 100));
    }
    return bars;
}
