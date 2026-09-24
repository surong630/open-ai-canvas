import { useQuery } from "@tanstack/react-query";
import { App } from "antd";
import { AudioLines, ChevronRight, Database, FileText, Folder, Home, Image as ImageIcon, LoaderCircle, Plus, Sparkles, Video, Zap } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

import { ProjectPreview } from "@/components/canvas/canvas-project-card";
import { ProductAccountMenu } from "@/components/layout/product-account-menu";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { loadCanvasProjectPage } from "@/lib/workspace-route-modules";
import { listRemoteCanvasProjectsPage } from "@/services/api/user-data";
import { createCanvasProjectWithRemoteSync } from "@/services/user-data-sync";
import { useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";

import "./product-home.css";

const creationEntries = [
    { key: "video", label: "影", description: "视频生成", icon: Video },
    { key: "image", label: "图", description: "图片生成", icon: ImageIcon },
    { key: "audio", label: "声", description: "音频生成", icon: AudioLines },
    { key: "text", label: "文", description: "文本生成", icon: FileText },
] as const;

export default function ProductHomePage() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [creating, setCreating] = useState(false);
    const appearance = useAppearanceStore((state) => state.appearance);
    const user = useUserStore((state) => state.user);
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);
    const { availableMicrocredits } = useWalletBalance(user?.id, creditsEnabled);
    const recentQuery = useQuery({
        queryKey: ["product-home", "recent-canvases", user?.id],
        queryFn: () => listRemoteCanvasProjectsPage({ page: 1, pageSize: 4, sort: "updated" }),
        enabled: Boolean(user?.id),
        staleTime: 30_000,
    });
    const recentProjects = recentQuery.data?.projects || [];
    const balance = availableMicrocredits === null ? "--" : (availableMicrocredits / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 2 });

    const createCanvas = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const count = recentQuery.data?.total || 0;
            const { id, syncError } = await createCanvasProjectWithRemoteSync(`自由画布 ${count + 1}`);
            if (syncError) message.warning(syncError instanceof Error ? `画布已在本地创建，云端同步失败：${syncError.message}` : "画布已在本地创建，云端同步失败");
            void loadCanvasProjectPage();
            navigate(`/canvas/${id}`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "创建画布失败");
            setCreating(false);
        }
    };

    const openCanvas = (id: string) => {
        void loadCanvasProjectPage();
        navigate(`/canvas/${id}`);
    };

    return (
        <main className="product-home">
            <aside className="product-home__sidebar">
                <div className="product-home__brand">
                    <span className="product-home__brand-mark" aria-hidden><i /></span>
                    <div><h1>{appearance.brandName || "系统名称"}</h1><small>AI CREATIVE STUDIO</small></div>
                </div>
                <nav aria-label="首页导航">
                    <NavLink to="/home" end><Home />首页</NavLink>
                    <NavLink to="/canvas"><Folder />项目</NavLink>
                    <NavLink to="/assets"><Database />资产</NavLink>
                </nav>
                <div className="product-home__sidebar-status"><i aria-hidden /><span>创作服务在线</span></div>
            </aside>

            <section className="product-home__workspace">
                <div className="product-home__ambient" aria-hidden><i /><i /><i /></div>
                <header className="product-home__topbar">
                    <span className="product-home__console"><i /> CREATIVE CONSOLE</span>
                    {creditsEnabled ? <button type="button" className="product-home__credits" onClick={() => navigate("/credits")}><Zap /><span>{balance}</span></button> : null}
                    <ProductAccountMenu triggerClassName="product-home__avatar" />
                </header>

                <div className="product-home__content">
                    <header className="product-home__intro">
                        <span><Sparkles /> AI CREATIVE WORKSPACE</span>
                        <h2>让灵感进入创作现场</h2>
                        <p>从一个想法开始，连接影像、声音、画面与文字。</p>
                    </header>

                    <button type="button" className="product-home__new-canvas" onClick={() => void createCanvas()} disabled={creating}>
                        <span className="product-home__new-orbit" aria-hidden><i /><i /></span>
                        <span className="product-home__new-icon">{creating ? <LoaderCircle className="product-home__spinner" /> : <Plus />}</span>
                        <span className="product-home__new-copy">
                            <small>START NEW PROJECT</small>
                            <strong>{creating ? "正在创建创作空间" : "新建画布创作"}</strong>
                            <span>打开自由画布，将你的创意连接成作品</span>
                        </span>
                        <span className="product-home__new-action">开始创作<ChevronRight /></span>
                    </button>

                    <section className="product-home__creation-grid" aria-label="创作类型">
                        {creationEntries.map(({ key, label, description, icon: Icon }) => (
                            <button key={key} type="button" data-kind={key} onClick={() => navigate("/create")}>
                                <span className="product-home__creation-icon"><Icon /></span>
                                <span><strong>{label}</strong><small>{description}</small></span>
                                <ChevronRight className="product-home__creation-arrow" />
                            </button>
                        ))}
                    </section>

                    <section className="product-home__recent" aria-labelledby="product-home-recent-title">
                        <header>
                            <h2 id="product-home-recent-title">最近项目</h2>
                            <button type="button" onClick={() => navigate("/canvas")}>查看全部<ChevronRight /></button>
                        </header>

                        {recentQuery.isLoading ? (
                            <div className="product-home__recent-state"><LoaderCircle className="product-home__spinner" />正在加载最近项目</div>
                        ) : recentQuery.isError ? (
                            <div className="product-home__recent-state is-error">
                                <span>最近项目加载失败</span>
                                <button type="button" onClick={() => void recentQuery.refetch()}>重新加载</button>
                            </div>
                        ) : recentProjects.length === 0 ? (
                            <div className="product-home__recent-state">还没有画布项目，点击上方开始创作</div>
                        ) : (
                            <div className="product-home__recent-grid">
                                {recentProjects.map((project) => (
                                    <button key={project.id} type="button" className="product-home__project" onClick={() => openCanvas(project.id)}>
                                        <span className="product-home__project-preview"><ProjectPreview project={{ id: project.id, nodes: project.previewNodes }} preferLatestImage /></span>
                                        <span className="product-home__project-copy">
                                            <strong>{project.title || "未命名"}</strong>
                                            <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}

function formatDate(value: string) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "时间不可用";
    return new Date(timestamp).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}
