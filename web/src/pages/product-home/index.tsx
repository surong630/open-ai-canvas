import { useQuery } from "@tanstack/react-query";
import { App } from "antd";
import { ChevronRight, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { ProjectPreview } from "@/components/canvas/canvas-project-card";
import { ProductPageHeader } from "@/components/layout/product-page-header";
import { ProductPrimarySidebar } from "@/components/layout/product-primary-sidebar";
import { NODE_DEFAULT_SIZE } from "@/constant/canvas";
import { createCanvasNode } from "@/lib/canvas/canvas-project-domain";
import { loadCanvasProjectPage } from "@/lib/workspace-route-modules";
import { listRemoteCanvasProjectsPage } from "@/services/api/user-data";
import { createProductProject, listProductProjects } from "@/services/api/product-projects";
import { createCanvasProjectWithRemoteSync } from "@/services/user-data-sync";
import { useUserStore } from "@/stores/use-user-store";
import { CanvasNodeType } from "@/types/canvas";

import cardAudio from "@/assets/product-home/card-audio@2x.png";
import cardImage from "@/assets/product-home/card-image@2x.png";
import cardText from "@/assets/product-home/card-text@2x.png";
import cardVideo from "@/assets/product-home/card-video@2x.png";
import createAdd from "@/assets/product-home/create-add@2x.png";
import iconArrow from "@/assets/product-home/icon-arrow@2x.png";
import iconAudio from "@/assets/product-home/icon-audio@2x.png";
import iconImage from "@/assets/product-home/icon-image@2x.png";
import iconText from "@/assets/product-home/icon-text@2x.png";
import iconVideo from "@/assets/product-home/icon-video@2x.png";

import "./product-home.css";

const creationEntries = [
    { key: "video", label: "视频生成", projectTitle: "视频创作", nodeTitle: "视频", nodeType: CanvasNodeType.Video, description: "让想法成为动态画面", background: cardVideo, icon: iconVideo },
    { key: "image", label: "图片生成", projectTitle: "图片创作", nodeTitle: "图片", nodeType: CanvasNodeType.Image, description: "将文字灵感变成图像", background: cardImage, icon: iconImage },
    { key: "audio", label: "音频生成", projectTitle: "音频创作", nodeTitle: "音频", nodeType: CanvasNodeType.Audio, description: "为作品生成声音", background: cardAudio, icon: iconAudio },
    { key: "text", label: "文本生成", projectTitle: "文本创作", nodeTitle: "文本", nodeType: CanvasNodeType.Text, description: "从创意到文案，开启写作", background: cardText, icon: iconText },
] as const;

export default function ProductHomePage() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [creating, setCreating] = useState(false);
    const user = useUserStore((state) => state.user);
    const recentQuery = useQuery({
        queryKey: ["product-home", "recent-canvases", user?.id],
        queryFn: async () => {
            // 二开接口先探测，暂不替换旧接口的数据来源，避免影响现有首页展示。
            try {
                await listProductProjects({ recycle: false });
            } catch (error) {
                console.warn("二开项目列表请求失败，继续使用旧项目接口", error);
            }
            return listRemoteCanvasProjectsPage({ page: 1, pageSize: 4, sort: "updated" });
        },
        enabled: Boolean(user?.id),
        staleTime: 30_000,
        refetchOnMount: "always",
    });
    const recentProjects = recentQuery.data?.projects || [];

    const createCanvas = async (starter?: { nodeType: CanvasNodeType; nodeTitle: string; projectTitle: string }) => {
        if (!user) {
            navigate("/email-login?next=%2Fhome");
            return;
        }
        if (creating) return;
        setCreating(true);
        try {
            const count = recentQuery.data?.total || 0;
            const starterNode = starter ? createHomeStarterNode(starter.nodeType, starter.nodeTitle) : undefined;
            const projectName = `${starter?.projectTitle || "自由画布"} ${count + 1}`;
            // 二开项目创建与旧画布创建并行发起；二开失败不阻断旧流程，也不替换旧数据源。
            const productProjectRequest = createProductProject({ itemType: 2, name: projectName }).catch((error) => {
                console.warn("二开项目创建失败，继续使用旧画布创建接口", error);
                return undefined;
            });
            const legacyProjectRequest = createCanvasProjectWithRemoteSync(
                projectName,
                undefined,
                starterNode ? { nodes: [starterNode] } : undefined,
            );
            const [{ id, syncError }] = await Promise.all([legacyProjectRequest, productProjectRequest]);
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
            <ProductPrimarySidebar />

            <section className="product-home__workspace">
                <ProductPageHeader className="product-home__topbar" />

                <div className="product-home__content">
                    <section className="product-home__hero">
                        <div className="product-home__hero-copy">
                            <span className="product-home__eyebrow"><i />无限画布 · 自由创作</span>
                            <h2>让灵感，<em>从这里开始</em></h2>
                            <p>在无限画布中，组合图片、视频、音频与文字，开启你的创作</p>
                            <button type="button" className="product-home__new-canvas" onClick={() => void createCanvas()} disabled={creating}>
                                {creating ? <LoaderCircle className="product-home__spinner" /> : <img src={createAdd} alt="" />}
                                <span>{creating ? "正在创建" : "新建画布"}</span>
                            </button>
                        </div>
                    </section>

                    <section className="product-home__creation-grid" aria-label="创作类型">
                        {creationEntries.map(({ key, label, projectTitle, nodeTitle, nodeType, description, background, icon }) => (
                            <button key={key} type="button" disabled={creating} onClick={() => void createCanvas({ nodeType, nodeTitle, projectTitle })}>
                                <img className="product-home__creation-background" src={background} alt="" />
                                <span className="product-home__creation-copy"><span><img src={icon} alt="" /><strong>{label}</strong></span><small>{description}</small></span>
                                <img className="product-home__creation-arrow" src={iconArrow} alt="" />
                            </button>
                        ))}
                    </section>

                    {user ? <section className="product-home__recent" aria-labelledby="product-home-recent-title">
                        <header>
                            <h2 id="product-home-recent-title">最近项目</h2>
                            <button type="button" onClick={() => navigate("/canvas-projects")}>查看全部<ChevronRight /></button>
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
                                        <span className="product-home__project-preview">
                                            {project.previewNodes.length > 0 ? (
                                                <ProjectPreview project={{ id: project.id, nodes: project.previewNodes }} preferLatestImage />
                                            ) : (
                                                <span className="product-home__project-empty" aria-hidden><ImageIcon /></span>
                                            )}
                                        </span>
                                        <span className="product-home__project-copy">
                                            <strong>{project.title || "未命名"}</strong>
                                            <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section> : null}
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

function createHomeStarterNode(type: CanvasNodeType, title: string) {
    const size = NODE_DEFAULT_SIZE[type];
    return {
        ...createCanvasNode(type, { x: 120 + size.width / 2, y: 120 + size.height / 2 }),
        title,
    };
}
