import { useQuery } from "@tanstack/react-query";
import { App, Button, Dropdown, Input, type MenuProps } from "antd";
import { FolderPlus, Image as ImageIcon, LoaderCircle, MoreHorizontal, Plus, Search, SquarePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";

import folderCover from "@/assets/canvas-projects/folder-cover@2x.png";
import projectCover from "@/assets/canvas-projects/project-cover@2x.png";
import recycleCheckboxNormal from "@/assets/canvas-projects/recycle-checkbox-normal@2x.png";
import recycleCheckboxSelected from "@/assets/canvas-projects/recycle-checkbox-selected@2x.png";
import recycleSelectAll from "@/assets/canvas-projects/recycle-select-all@2x.png";
import { ProjectPreview, projectPreviewMedia } from "@/components/canvas/canvas-project-card";
import { ProductPageHeader } from "@/components/layout/product-page-header";
import { ProductPrimarySidebar } from "@/components/layout/product-primary-sidebar";
import { AppModal } from "@/components/ui/product/app-modal";
import { loadCanvasProjectPage } from "@/lib/workspace-route-modules";
import { listRemoteCanvasProjectsPage, type CanvasLibrarySummary } from "@/services/api/user-data";
import { createCanvasProjectWithRemoteSync, loadCanvasProjectForEditing, saveRemoteUserDataNow } from "@/services/user-data-sync";
import { useCanvasStore } from "@/stores/canvas/use-canvas-store";
import { useUserStore } from "@/stores/use-user-store";

import "./canvas-projects.css";

type FolderPreview = { id: string; title: string; updatedAt: string };

const initialFolderStylePreviews: FolderPreview[] = [
    { id: "folder-style-preview-1", title: "未命名项目", updatedAt: "2026-09-18" },
    { id: "folder-style-preview-2", title: "未命名项目", updatedAt: "2026-09-18" },
];

async function loadAllCanvasProjects(signal?: AbortSignal) {
    const pageSize = 100;
    let page = 1;
    let result = await listRemoteCanvasProjectsPage({ page, pageSize, sort: "updated", signal });
    const projects = [...result.projects];
    while (result.hasMore) {
        page += 1;
        result = await listRemoteCanvasProjectsPage({ page, pageSize, sort: "updated", signal });
        projects.push(...result.projects);
    }
    return { ...result, projects, page: 1, pageSize: projects.length };
}

export default function CanvasProjectsPage() {
    const navigate = useNavigate();
    const { folderId } = useParams<{ folderId?: string }>();
    const { message } = App.useApp();
    const [keyword, setKeyword] = useState("");
    const [creating, setCreating] = useState(false);
    const [folderStylePreviews, setFolderStylePreviews] = useState<FolderPreview[]>(() => initialFolderStylePreviews.map((folder) => ({ ...folder })));
    const [recycleBinOpen, setRecycleBinOpen] = useState(false);
    const [selectedRecycleProjectIds, setSelectedRecycleProjectIds] = useState<Set<string>>(() => new Set());
    const user = useUserStore((state) => state.user);
    const renameStoredCanvasProject = useCanvasStore((state) => state.renameProject);
    const projectsQuery = useQuery({
        queryKey: ["canvas-projects-page", user?.id],
        queryFn: ({ signal }) => loadAllCanvasProjects(signal),
        enabled: Boolean(user?.id),
        staleTime: 30_000,
        refetchOnMount: "always",
    });
    const projects = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
        const items = projectsQuery.data?.projects || [];
        if (!normalizedKeyword) return items;
        return items.filter((project) => (project.title || "未命名项目").toLocaleLowerCase("zh-CN").includes(normalizedKeyword));
    }, [keyword, projectsQuery.data?.projects]);
    const visibleFolderPreviews = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
        return normalizedKeyword ? folderStylePreviews.filter((folder) => folder.title.toLocaleLowerCase("zh-CN").includes(normalizedKeyword)) : folderStylePreviews;
    }, [keyword]);
    const activeFolder = folderId ? folderStylePreviews.find((folder) => folder.id === folderId) : undefined;
    const isFolderView = Boolean(folderId);
    const folderTitle = activeFolder?.title || "未命名项目";

    const createCanvas = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const count = projectsQuery.data?.total || 0;
            const { id, syncError } = await createCanvasProjectWithRemoteSync(`自由画布 ${count + 1}`);
            if (syncError) message.warning(syncError instanceof Error ? `画布已在本地创建，云端同步失败：${syncError.message}` : "画布已在本地创建，云端同步失败");
            void loadCanvasProjectPage();
            navigate(`/canvas/${id}`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "创建画布失败");
            setCreating(false);
        }
    };

    const folderPlaceholder = () => message.info("文件夹功能等待后端接入");
    const renameFolder = async (folderIdToRename: string, title: string) => {
        setFolderStylePreviews((current) => current.map((folder) => folder.id === folderIdToRename ? { ...folder, title } : folder));
        return true;
    };
    const renameCanvasProject = async (projectId: string, title: string) => {
        try {
            await loadCanvasProjectForEditing(projectId);
            renameStoredCanvasProject(projectId, title);
            await saveRemoteUserDataNow(projectId);
            await projectsQuery.refetch();
            return true;
        } catch (error) {
            message.error(error instanceof Error ? error.message : "重命名失败");
            return false;
        }
    };
    const openRecycleBin = () => {
        setSelectedRecycleProjectIds(new Set());
        setRecycleBinOpen(true);
    };

    return (
        <main className="canvas-projects-page grid h-dvh min-h-dvh grid-cols-[241px_minmax(0,1fr)] overflow-hidden bg-[#191919] text-[#FFFFFF]">
            <ProductPrimarySidebar />

            <section className="flex min-h-0 min-w-0 flex-col bg-[#191919]">
                <ProductPageHeader />

                <div className="canvas-projects-page__content min-h-0 flex-1 overflow-y-auto pt-[10px] pr-10 pb-12 pl-[41px]">
                    <div className="flex min-h-9 items-center justify-between gap-8 pl-[18px]">
                        {isFolderView ? (
                            <h2 className="m-0 flex items-center text-[16px] leading-6 font-bold text-[#969799]">
                                <button type="button" className="text-[#969799] font-bold hover:text-[#FFFFFF]" onClick={() => navigate("/canvas-projects")}>全部项目</button>
                                <span>&nbsp;/&nbsp;<span className="text-[#F5F5F5] font-bold">{folderTitle}</span></span>
                            </h2>
                        ) : <h2 className="m-0 text-[16px] leading-6 !font-bold text-[#F5F5F5]">全部项目</h2>}
                        <div className="flex items-center gap-3">
                            <Input
                                allowClear
                                className="canvas-projects-page__search w-[202px]"
                                prefix={<Search className="size-[13px] text-[#929292]" />}
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="请输入名称进行搜索"
                                aria-label="搜索项目"
                            />
                            <Button className="canvas-projects-page__toolbar-button" type="text" icon={<Trash2 className="size-[14px]" />} onClick={openRecycleBin}>回收站</Button>
                            {isFolderView ? (
                                <Button className="canvas-projects-page__toolbar-button" type="text" icon={<SquarePlus className="size-[15px]" />} disabled={creating} onClick={() => void createCanvas()}>新建项目</Button>
                            ) : (
                                <Button className="canvas-projects-page__toolbar-button" type="text" icon={<FolderPlus className="size-[15px]" />} onClick={folderPlaceholder}>新建文件夹</Button>
                            )}
                        </div>
                    </div>

                    <section className="mt-7 grid grid-cols-[repeat(auto-fill,212px)] gap-x-[15px] gap-y-[27px]" aria-label="全部项目列表">
                        <article className="canvas-projects-page__card group relative self-start text-left">
                            <button type="button" className="block w-full text-left" disabled={creating} onClick={() => void createCanvas()}>
                                <span className="flex h-[118px] w-[212px] items-center justify-center overflow-hidden rounded-[10px] border border-[#505050] bg-[#2A2A2A]">
                                    <span className="flex flex-col items-center gap-[13px] text-[#FFFFFF]">
                                        {creating ? <LoaderCircle className="size-7 animate-spin text-[#8D8D8D]" /> : <Plus className="size-7 text-[#8D8D8D]" />}
                                        <strong className="text-[14px] leading-[18px] font-bold">{creating ? "正在创建" : "开始创作"}</strong>
                                    </span>
                                </span>
                                <strong className="mt-2 block truncate px-2 text-[14px] leading-5 font-bold text-[#FFFFFF]">创建新的视频项目</strong>
                            </button>
                        </article>

                        {!isFolderView ? visibleFolderPreviews.map((folder) => (
                            <FolderStyleCard
                                key={folder.id}
                                folder={folder}
                                onOpen={() => navigate(`/canvas-projects/folders/${folder.id}`)}
                                onRename={(title) => renameFolder(folder.id, title)}
                                onUnavailable={folderPlaceholder}
                            />
                        )) : null}

                        {projectsQuery.isLoading ? <ProjectStateCard icon={<LoaderCircle className="size-5 animate-spin" />} label="正在加载项目" /> : null}
                        {projectsQuery.isError ? <ProjectStateCard icon={<ImageIcon className="size-5" />} label="项目加载失败" actionLabel="重新加载" onAction={() => void projectsQuery.refetch()} /> : null}
                        {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 && (isFolderView || visibleFolderPreviews.length === 0) ? <ProjectStateCard icon={<ImageIcon className="size-5" />} label={keyword ? "没有匹配的项目" : "还没有画布项目"} /> : null}
                        {projects.map((project) => <CanvasProjectItem key={project.id} project={project} insideFolder={isFolderView} onRename={(title) => renameCanvasProject(project.id, title)} onOpen={() => { void loadCanvasProjectPage(); navigate(`/canvas/${project.id}`); }} />)}
                    </section>
                </div>
            </section>

            <RecycleBinModal
                open={recycleBinOpen}
                projects={projectsQuery.data?.projects || []}
                selectedProjectIds={selectedRecycleProjectIds}
                onSelectionChange={setSelectedRecycleProjectIds}
                onClose={() => setRecycleBinOpen(false)}
                onRestore={() => message.info(selectedRecycleProjectIds.size ? "恢复功能等待回收站接口接入" : "请先选择要恢复的项目")}
            />
        </main>
    );
}

function RecycleBinModal({ open, projects, selectedProjectIds, onSelectionChange, onClose, onRestore }: {
    open: boolean;
    projects: CanvasLibrarySummary[];
    selectedProjectIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onClose: () => void;
    onRestore: () => void;
}) {
    const allSelected = projects.length > 0 && projects.every((project) => selectedProjectIds.has(project.id));
    const toggleProject = (projectId: string) => {
        const next = new Set(selectedProjectIds);
        if (next.has(projectId)) next.delete(projectId);
        else next.add(projectId);
        onSelectionChange(next);
    };
    const toggleAll = () => onSelectionChange(allSelected ? new Set() : new Set(projects.map((project) => project.id)));

    return (
        <AppModal
            flush
            centered
            open={open}
            title={null}
            footer={null}
            width="min(1029px, calc(100vw - 32px))"
            rootClassName="canvas-projects-recycle-modal"
            styles={{ body: { height: "100%" } }}
            closeIcon={<span className="canvas-projects-recycle-modal__close" aria-hidden="true" />}
            onCancel={onClose}
        >
            <div className="canvas-projects-recycle-modal__shell">
                <header className="canvas-projects-recycle-modal__header">
                    <h2>回收站</h2>
                    <p>删除的文件夹/项目仅保留30天，30天后将永久删除</p>
                </header>
                <div className="canvas-projects-recycle-modal__content">
                    {projects.length ? (
                        <div className="canvas-projects-recycle-modal__grid">
                            {projects.map((project) => {
                                const selected = selectedProjectIds.has(project.id);
                                const previewMedia = projectPreviewMedia(project.previewNodes, true);
                                return (
                                    <button
                                        key={project.id}
                                        type="button"
                                        role="checkbox"
                                        aria-checked={selected}
                                        className="canvas-projects-recycle-card"
                                        onClick={() => toggleProject(project.id)}
                                    >
                                        <span className="canvas-projects-recycle-card__cover">
                                            {previewMedia ? <ProjectPreview project={{ id: project.id, nodes: project.previewNodes }} preferLatestImage /> : <img className="canvas-projects-recycle-card__placeholder" src={projectCover} alt="" />}
                                            <img className="canvas-projects-recycle-card__checkbox" src={selected ? recycleCheckboxSelected : recycleCheckboxNormal} alt="" />
                                        </span>
                                        <strong title={project.title || "未命名项目"}>{project.title || "未命名项目"}</strong>
                                        <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)} · 剩余30天</time>
                                    </button>
                                );
                            })}
                        </div>
                    ) : <ProjectStateCard icon={<ImageIcon className="size-5" />} label="还没有画布项目" />}
                </div>
                <footer className="canvas-projects-recycle-modal__footer">
                    <button type="button" className="canvas-projects-recycle-modal__select-all" onClick={toggleAll} aria-pressed={allSelected}>
                        <img src={allSelected ? recycleSelectAll : recycleCheckboxNormal} alt="" />
                        <span>已选择{selectedProjectIds.size}项</span>
                    </button>
                    <button type="button" className="canvas-projects-recycle-modal__restore" onClick={onRestore}>恢复</button>
                </footer>
            </div>
        </AppModal>
    );
}

function FolderStyleCard({ folder, onOpen, onRename, onUnavailable }: { folder: FolderPreview; onOpen: () => void; onRename: (title: string) => Promise<boolean>; onUnavailable: () => void }) {
    const [editing, setEditing] = useState(false);
    const items: MenuProps["items"] = [
        { key: "open", label: "打开", onClick: onOpen },
        { key: "rename", label: "重命名", onClick: () => setEditing(true) },
        ...["更换封面", "删除文件夹"].map((label) => ({ key: label, label, onClick: onUnavailable })),
    ];
    return (
        <article className="canvas-projects-page__card group relative self-start">
            <button type="button" className="block w-full text-left" disabled={editing} onClick={onOpen}>
                <img className="h-[118px] w-[212px] object-contain" src={folderCover} alt="" />
            </button>
            <InlineEditableTitle title={folder.title} editing={editing} onEditingChange={setEditing} onSave={onRename} />
            <time className="mt-[3px] block px-2 text-[13px] leading-[18px] font-normal text-[#969799]" dateTime={folder.updatedAt}>{folder.updatedAt}</time>
            <Dropdown rootClassName="canvas-projects-menu" placement="bottomRight" trigger={["click"]} menu={{ className: "canvas-projects-menu__list", items, onClick: ({ domEvent }) => domEvent.stopPropagation() }}>
                <button type="button" className="canvas-projects-page__more absolute top-[123px] right-1 grid h-7 w-8 place-items-center rounded-md text-[#919191] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" onClick={(event) => event.stopPropagation()} aria-label={`${folder.title} 文件夹操作`}><MoreHorizontal className="size-4" /></button>
            </Dropdown>
        </article>
    );
}

function CanvasProjectItem({ project, onOpen, onRename, insideFolder }: { project: CanvasLibrarySummary; onOpen: () => void; onRename: (title: string) => Promise<boolean>; insideFolder: boolean }) {
    const { message } = App.useApp();
    const [editing, setEditing] = useState(false);
    const previewMedia = projectPreviewMedia(project.previewNodes, true);
    const unavailable = () => message.info("该操作等待项目文件夹能力接入");
    const items: MenuProps["items"] = [
        { key: "open", label: "打开", onClick: onOpen },
        { key: "rename", label: "重命名", onClick: () => setEditing(true) },
        { key: "cover", label: "更换封面", onClick: unavailable },
        insideFolder
            ? { key: "remove-folder", label: "移除文件夹", onClick: unavailable }
            : {
                key: "move",
                label: "移动文件夹",
                popupClassName: "canvas-projects-submenu",
                children: [
                    { key: "folder-1", label: "文件夹1", onClick: unavailable },
                    { key: "folder-2", label: "文件夹2", onClick: unavailable },
                ],
            },
        { key: "delete", label: "删除项目", onClick: unavailable },
    ];
    return (
        <article className="canvas-projects-page__card group relative self-start text-left">
            <button type="button" className="block w-full text-left" disabled={editing} onClick={onOpen}>
                <span className="block h-[118px] w-[212px] overflow-hidden rounded-[10px] bg-[#222222]">
                    {previewMedia ? <ProjectPreview project={{ id: project.id, nodes: project.previewNodes }} preferLatestImage /> : <img className="size-full object-cover" src={projectCover} alt="" />}
                </span>
            </button>
            <InlineEditableTitle title={project.title || "未命名项目"} editing={editing} onEditingChange={setEditing} onSave={onRename} reserveMoreSpace />
            <time className="mt-[3px] block px-2 text-[13px] leading-[18px] font-normal text-[#969799]" dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
            <Dropdown rootClassName="canvas-projects-menu" placement="bottomRight" trigger={["click"]} menu={{ className: "canvas-projects-menu__list", items, onClick: ({ domEvent }) => domEvent.stopPropagation() }}>
                <button type="button" className="canvas-projects-page__more absolute top-[123px] right-1 grid h-7 w-8 place-items-center rounded-md text-[#919191] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" onClick={(event) => event.stopPropagation()} aria-label={`${project.title || "未命名项目"} 项目操作`}><MoreHorizontal className="size-4" /></button>
            </Dropdown>
        </article>
    );
}

function InlineEditableTitle({ title, editing, onEditingChange, onSave, reserveMoreSpace = false }: {
    title: string;
    editing: boolean;
    onEditingChange: (editing: boolean) => void;
    onSave: (title: string) => Promise<boolean>;
    reserveMoreSpace?: boolean;
}) {
    const [displayTitle, setDisplayTitle] = useState(title);
    const [draft, setDraft] = useState(title);
    const savingRef = useRef(false);
    const cancellingRef = useRef(false);

    useEffect(() => {
        setDisplayTitle(title);
        if (!editing) setDraft(title);
    }, [editing, title]);

    useEffect(() => {
        if (editing) {
            cancellingRef.current = false;
            setDraft(displayTitle);
        }
    }, [displayTitle, editing]);

    const save = async () => {
        if (cancellingRef.current) {
            cancellingRef.current = false;
            return;
        }
        if (savingRef.current) return;
        const nextTitle = draft.trim();
        if (!nextTitle || nextTitle === displayTitle) {
            setDraft(displayTitle);
            onEditingChange(false);
            return;
        }
        savingRef.current = true;
        onEditingChange(false);
        const saved = await onSave(nextTitle);
        if (saved) setDisplayTitle(nextTitle);
        else setDraft(displayTitle);
        savingRef.current = false;
    };

    return (
        <div className={`canvas-projects-page__editable-title${reserveMoreSpace ? " has-more-action" : ""}`}>
            {editing ? (
                <Input
                    autoFocus
                    maxLength={80}
                    className="canvas-projects-page__title-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => void save()}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") {
                            cancellingRef.current = true;
                            setDraft(displayTitle);
                            onEditingChange(false);
                        }
                    }}
                />
            ) : <strong title={displayTitle}>{displayTitle}</strong>}
        </div>
    );
}

function ProjectStateCard({ icon, label, actionLabel, onAction }: { icon: ReactNode; label: string; actionLabel?: string; onAction?: () => void }) {
    return (
        <div className="flex h-[118px] w-[212px] flex-col items-center justify-center gap-2 rounded-[10px] border border-[#424242] bg-[#222222] text-[13px] text-[#969799]">
            {icon}<span>{label}</span>{actionLabel ? <button type="button" className="text-[#A998FF]" onClick={onAction}>{actionLabel}</button> : null}
        </div>
    );
}

function formatDate(value: string) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "时间不可用";
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
