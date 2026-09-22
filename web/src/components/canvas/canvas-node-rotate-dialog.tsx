import { useEffect, useState } from "react";
import { App, Button, Modal, Select } from "antd";
import { FlipHorizontal2, FlipVertical2, RotateCw } from "lucide-react";

import { rotateImageDataUrl, type ImageRotateParams } from "@/lib/canvas/canvas-image-data";

const initialParams: ImageRotateParams = { degrees: 0, flipHorizontal: false, flipVertical: false };
const angleOptions: Array<{ label: string; value: ImageRotateParams["degrees"] }> = [
    { label: "0°", value: 0 },
    { label: "90°", value: 90 },
    { label: "180°", value: 180 },
    { label: "270°", value: 270 },
];

export function CanvasNodeRotateDialog({
    dataUrl,
    open,
    onClose,
    onConfirm,
}: {
    dataUrl: string;
    open: boolean;
    onClose: () => void;
    onConfirm: (dataUrl: string) => Promise<void>;
}) {
    const { message } = App.useApp();
    const [params, setParams] = useState<ImageRotateParams>(initialParams);
    const [preview, setPreview] = useState<{ source: string; key: string; dataUrl: string } | null>(null);
    const [processing, setProcessing] = useState(false);
    const previewKey = `${params.degrees}:${params.flipHorizontal}:${params.flipVertical}`;
    const readyPreview = preview?.source === dataUrl && preview.key === previewKey ? preview.dataUrl : "";
    const changed = params.degrees !== 0 || params.flipHorizontal || params.flipVertical;

    useEffect(() => {
        if (!open) return;
        setParams(initialParams);
    }, [dataUrl, open]);

    useEffect(() => {
        if (!open || !dataUrl) return;
        let cancelled = false;
        const key = `${params.degrees}:${params.flipHorizontal}:${params.flipVertical}`;
        void rotateImageDataUrl(dataUrl, params).then((result) => {
            if (!cancelled) setPreview({ source: dataUrl, key, dataUrl: result });
        }).catch((error) => {
            if (!cancelled) message.error(error instanceof Error ? error.message : "图片预览失败");
        });
        return () => { cancelled = true; };
    }, [dataUrl, message, open, params]);

    const save = async () => {
        if (!readyPreview || !changed || processing) return;
        setProcessing(true);
        try {
            await onConfirm(readyPreview);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "旋转图片保存失败");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal title="旋转与镜像" open={open && Boolean(dataUrl)} onCancel={processing ? undefined : onClose} footer={null} width={760} centered destroyOnHidden closable={!processing}>
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Select aria-label="旋转角度" value={params.degrees} options={angleOptions} className="w-28" onChange={(degrees) => setParams((current) => ({ ...current, degrees }))} />
                    <Button icon={<RotateCw className="size-4" />} onClick={() => setParams((current) => ({ ...current, degrees: ((current.degrees + 90) % 360) as ImageRotateParams["degrees"] }))}>顺时针 90°</Button>
                    <Button aria-pressed={params.flipHorizontal} icon={<FlipHorizontal2 className="size-4" />} onClick={() => setParams((current) => ({ ...current, flipHorizontal: !current.flipHorizontal }))}>水平镜像</Button>
                    <Button aria-pressed={params.flipVertical} icon={<FlipVertical2 className="size-4" />} onClick={() => setParams((current) => ({ ...current, flipVertical: !current.flipVertical }))}>垂直镜像</Button>
                </div>
                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border bg-black/80 p-4">
                    {readyPreview ? <img src={readyPreview} alt="旋转与镜像预览" className="max-h-[58vh] max-w-full object-contain" draggable={false} /> : <span className="text-sm text-white/70">正在生成预览…</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button disabled={processing} onClick={onClose}>取消</Button>
                    <Button type="primary" loading={processing} disabled={!readyPreview || !changed} onClick={() => void save()}>保存为新图片</Button>
                </div>
            </div>
        </Modal>
    );
}
