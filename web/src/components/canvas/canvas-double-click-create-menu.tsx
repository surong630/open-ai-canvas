import type { ReactNode } from "react";

import { SpotlightSurface } from "@/components/ui/aceternity/spotlight-surface";
import audioIcon from "@/assets/canvas-create/windows-icon-audio.png";
import historyIcon from "@/assets/canvas-create/windows-icon-history.png";
import imageIcon from "@/assets/canvas-create/windows-icon-image.png";
import textIcon from "@/assets/canvas-create/windows-icon-text.png";
import uploadIcon from "@/assets/canvas-create/windows-icon-upload.png";
import videoIcon from "@/assets/canvas-create/windows-icon-video.png";
import { canvasThemes } from "@/lib/canvas-theme";
import { useActiveTheme } from "@/stores/canvas/use-canvas-theme-store";
import { CanvasNodeType, type CanvasNodeTypeId } from "@/types/canvas";

type CanvasDoubleClickCreateMenuProps = {
    position: { left: number; top: number };
    onAddNode: (type: CanvasNodeTypeId) => void;
    onUpload: () => void;
    onOpenAssets: () => void;
    onClose: () => void;
    inline?: boolean;
};

export function CanvasDoubleClickCreateMenu({ position, onAddNode, onUpload, onOpenAssets, onClose, inline = false }: CanvasDoubleClickCreateMenuProps) {
    const theme = canvasThemes[useActiveTheme()];
    const nodeItems = [
        { label: "文本", icon: <CreateMenuIcon src={textIcon} alt="" />, onClick: () => onAddNode(CanvasNodeType.Text) },
        { label: "图片", icon: <CreateMenuIcon src={imageIcon} alt="" />, onClick: () => onAddNode(CanvasNodeType.Image) },
        { label: "视频", icon: <CreateMenuIcon src={videoIcon} alt="" />, onClick: () => onAddNode(CanvasNodeType.Video) },
        { label: "音频", icon: <CreateMenuIcon src={audioIcon} alt="" />, onClick: () => onAddNode(CanvasNodeType.Audio) },
    ];
    const run = (action: () => void) => {
        action();
        onClose();
    };
    return (
        <SpotlightSurface
            spotlightColor={theme.toolbar.itemHover}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08 }}
            className={`pointer-events-auto aceternity-floating-panel ${inline ? "absolute bottom-[var(--canvas-dock-popover-offset)] -translate-x-1/2" : "fixed"} z-[var(--z-popover)] w-[224px] origin-top-left overflow-hidden rounded-xl border p-2 backdrop-blur-2xl`}
            style={{ left: position.left, ...(inline ? {} : { top: position.top }), background: theme.spatial.elevated, borderColor: theme.toolbar.border, color: theme.node.text }}
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <div className="grid gap-0.5">
                {nodeItems.map((item) => <CreateMenuItem key={item.label} label={item.label} icon={item.icon} color={theme.node.text} onClick={() => run(item.onClick)} />)}
                <div className="px-2 pb-1 pt-3 text-xs" style={{ color: theme.node.muted }}>添加资源</div>
                <CreateMenuItem label="上传文件" icon={<CreateMenuIcon src={uploadIcon} alt="" />} color={theme.node.text} onClick={() => run(onUpload)} />
                <CreateMenuItem label="从生成历史选择" icon={<CreateMenuIcon src={historyIcon} alt="" />} color={theme.node.text} onClick={() => run(onOpenAssets)} />
            </div>
        </SpotlightSurface>
    );
}

function CreateMenuIcon({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} className="size-[18px] shrink-0 object-contain" draggable={false} />;
}

function CreateMenuItem({ label, icon, color, onClick }: { label: string; icon: ReactNode; color: string; onClick: () => void }) {
    return <button type="button" className="canvas-double-click-create-menu-item flex h-9 items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors hover:bg-white/10" style={{ color }} onMouseDown={(event) => event.stopPropagation()} onClick={onClick}>{icon}<span>{label}</span></button>;
}
