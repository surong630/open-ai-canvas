import { AudioLines, Copy, Download, FolderOpen, Music2, Star, Trash2, X } from "lucide-react";

import emptyPreviewImage from "@/assets/product-assets/asset-preview-empty@2x.png";
import { CachedResourceImage } from "@/components/cached-resource-image";
import { AppModal } from "@/components/ui/product/app-modal";
import type { AudioAsset, ImageAsset, VideoAsset } from "@/stores/use-asset-store";

type PreviewAsset = ImageAsset | VideoAsset | AudioAsset;

type AssetPreviewModalProps = {
    asset: PreviewAsset | null;
    creatorName: string;
    onClose: () => void;
    onCopy: (text: string) => void;
    onSave: (asset: PreviewAsset) => void;
    onDownload: (asset: PreviewAsset) => void;
    onDelete: (asset: PreviewAsset) => void;
};

const assetKindLabel = { image: "图片", video: "视频", audio: "音频" } as const;

export function AssetPreviewModal({ asset, creatorName, onClose, onCopy, onSave, onDownload, onDelete }: AssetPreviewModalProps) {
    const prompt = asset ? assetMetadataText(asset, "prompt", "composerContent") || asset.note || "" : "";
    const model = asset ? assetMetadataText(asset, "producedModel", "model") : "";
    const quality = asset ? assetMetadataText(asset, "quality", "resolution") : "";
    const references = asset ? assetMetadataStrings(asset, "references") : [];
    const rating = asset?.kind === "audio" ? assetMetadataNumber(asset, "rating") : 0;
    const chips = asset ? previewChips(asset, model, quality) : [];
    const hasGenerationDetails = Boolean(prompt || chips.length || references.length);

    return (
        <AppModal
            flush
            centered
            open={Boolean(asset)}
            width="min(1208px, calc(100vw - 32px))"
            title={null}
            footer={null}
            closable={false}
            onCancel={onClose}
            rootClassName="asset-preview-modal-root"
            className="asset-preview-modal"
        >
            {asset ? (
                <section className={`asset-preview asset-preview--${asset.kind}`} aria-label={`查看${assetKindLabel[asset.kind]}：${asset.title}`}>
                    <PreviewStage asset={asset} />
                    <aside className="asset-preview__details">
                        <header className="asset-preview__header">
                            <h2>{assetKindLabel[asset.kind]}</h2>
                            <button type="button" aria-label={`关闭${assetKindLabel[asset.kind]}预览`} onClick={onClose}><X aria-hidden /></button>
                        </header>

                        <dl className="asset-preview__facts">
                            <div><dt>创作者</dt><dd title={creatorName}>{creatorName || "当前用户"}</dd></div>
                            <div><dt>创建于</dt><dd>{formatPreviewTime(asset.createdAt)}</dd></div>
                        </dl>

                        {asset.kind === "audio" ? (
                            <div className="asset-preview__rating" aria-label={`评级 ${rating} 星`}>
                                <span>评级</span>
                                <div>{[1, 2, 3, 4, 5].map((value) => <Star key={value} aria-hidden className={value <= rating ? "is-active" : ""} />)}</div>
                            </div>
                        ) : null}

                        <section className="asset-preview__generation">
                            <div className="asset-preview__section-title">
                                <span>生成信息</span>
                                {prompt ? <button type="button" aria-label="复制生成信息" title="复制生成信息" onClick={() => onCopy(prompt)}><Copy aria-hidden /></button> : null}
                            </div>
                            {hasGenerationDetails ? (
                                <>
                                    {prompt ? <p>{prompt}</p> : null}
                                    {chips.length ? <div className="asset-preview__chips" aria-label={`${assetKindLabel[asset.kind]}参数`}>{chips.map((chip) => <span key={chip}>{chip}</span>)}</div> : null}
                                    {references.length ? <PreviewReferences references={references} audio={asset.kind === "audio"} /> : null}
                                </>
                            ) : (
                                <div className="asset-preview__empty">
                                    <img src={emptyPreviewImage} alt="" aria-hidden />
                                    <span>暂无内容</span>
                                </div>
                            )}
                        </section>

                        <footer className="asset-preview__actions">
                            <button type="button" onClick={() => onSave(asset)}><FolderOpen aria-hidden /><span>保存到资产</span></button>
                            <button type="button" onClick={() => onDownload(asset)}><Download aria-hidden /><span>下载</span></button>
                            <button type="button" className="is-danger" onClick={() => onDelete(asset)}><Trash2 aria-hidden /><span>删除</span></button>
                        </footer>
                    </aside>
                </section>
            ) : null}
        </AppModal>
    );
}

function PreviewStage({ asset }: { asset: PreviewAsset }) {
    if (asset.kind === "audio") {
        return <div className="asset-preview__stage asset-preview__stage--audio"><Music2 aria-hidden className="asset-preview__audio-note" /><audio src={asset.data.url} controls preload="metadata" aria-label={asset.title || "音频"} /></div>;
    }
    if (asset.kind === "video") {
        return <div className="asset-preview__stage asset-preview__stage--video"><video src={asset.data.url} poster={asset.coverUrl || undefined} controls preload="metadata" playsInline aria-label={asset.title || "视频"} /></div>;
    }
    return (
        <div className="asset-preview__stage asset-preview__stage--image">
            <CachedResourceImage
                eager
                variant="original"
                storageKey={asset.data.storageKey}
                src={asset.data.dataUrl}
                alt={asset.title || "图片"}
                className="asset-preview__image"
                draggable={false}
                style={{
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                }}
            />
        </div>
    );
}

function PreviewReferences({ references, audio }: { references: string[]; audio: boolean }) {
    return (
        <section className="asset-preview__references">
            <h3>参考</h3>
            <div>{references.slice(0, 4).map((reference, index) => audio
                ? <span key={`${reference}-${index}`} aria-label={`参考音频 ${index + 1}`}><AudioLines aria-hidden /></span>
                : <img key={`${reference}-${index}`} src={reference} alt={`参考图 ${index + 1}`} loading="lazy" decoding="async" />)}</div>
        </section>
    );
}

function previewChips(asset: PreviewAsset, model: string, quality: string) {
    const chips: string[] = [];
    if (model) chips.push(model);
    if (asset.kind === "image" || asset.kind === "video") chips.push(imageAspectRatio(asset.data.width, asset.data.height));
    if (quality) chips.push(quality);
    if (asset.kind === "video" && asset.data.durationMs) chips.push(formatDuration(asset.data.durationMs));
    return chips;
}

function assetMetadataText(asset: PreviewAsset, ...keys: string[]) {
    for (const key of keys) {
        const value = asset.metadata?.[key];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

function assetMetadataStrings(asset: PreviewAsset, key: string) {
    const value = asset.metadata?.[key];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function assetMetadataNumber(asset: PreviewAsset, key: string) {
    const value = asset.metadata?.[key];
    return typeof value === "number" && Number.isFinite(value) ? Math.min(5, Math.max(0, Math.round(value))) : 0;
}

function formatPreviewTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date).replaceAll("/", "-");
}

function formatDuration(durationMs: number) {
    return `${Math.max(0, Math.round(durationMs / 1000))}s`;
}

function imageAspectRatio(width: number, height: number) {
    if (!width || !height) return "比例未知";
    const divisor = greatestCommonDivisor(Math.round(width), Math.round(height));
    return `${Math.round(width) / divisor}:${Math.round(height) / divisor}`;
}

function greatestCommonDivisor(left: number, right: number): number {
    return right === 0 ? Math.max(left, 1) : greatestCommonDivisor(right, left % right);
}
