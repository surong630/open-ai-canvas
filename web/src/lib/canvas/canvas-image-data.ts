import { loadRasterImage } from "@/lib/image-raster";
import { planImageTiles, resolveCropPixels, resolveUpscaleSize, type ImageCropRect, type ImageSplitParams, type ImageSplitPiece, type ImageUpscaleAlgorithm, type ImageUpscaleParams, type PixelSize } from "./image-operation-plan";

export { MAX_UPSCALE_LONG_EDGE, resolveUpscaleSize } from "./image-operation-plan";
export type { ImageCropRect, ImageSplitParams, ImageSplitPiece, ImageUpscaleAlgorithm, ImageUpscaleParams } from "./image-operation-plan";

type RasterCommand = {
    region: ImageCropRect;
    output: PixelSize;
    sampling: ImageUpscaleAlgorithm;
};

export type ImageAngleTransform = {
    horizontalAngle: number;
    pitchAngle: number;
    cameraDistance: number;
    wideAngle: boolean;
};

/** One raster pass shared by crop, grid extraction and resize. Failures never return the original as success. */
function renderPng(source: HTMLImageElement, command: RasterCommand): string {
    const output = document.createElement("canvas");
    Object.assign(output, command.output);
    const painter = output.getContext("2d");
    if (painter === null) throw new Error("浏览器无法创建图片处理画布");
    const { region, sampling } = command;
    painter.imageSmoothingEnabled = sampling !== "nearest";
    painter.imageSmoothingQuality = sampling === "high" ? "high" : "low";
    painter.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, output.width, output.height);
    const result = output.toDataURL("image/png");
    if (!result.startsWith("data:image/png")) throw new Error("图片导出失败");
    return result;
}

export type ImageRotateParams = {
    degrees: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;
};

export function rotatedImageSize(width: number, height: number, degrees: ImageRotateParams["degrees"]) {
    return degrees === 90 || degrees === 270 ? { width: height, height: width } : { width, height };
}

export async function rotateImageDataUrl(source: string, params: ImageRotateParams) {
    if (params.degrees === 0 && !params.flipHorizontal && !params.flipVertical) return source;
    const image = await loadRasterImage(source);
    const size = rotatedImageSize(image.naturalWidth, image.naturalHeight, params.degrees);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法处理图片：浏览器画布不可用");
    context.translate(size.width / 2, size.height / 2);
    context.scale(params.flipHorizontal ? -1 : 1, params.flipVertical ? -1 : 1);
    context.rotate((params.degrees * Math.PI) / 180);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    const result = canvas.toDataURL("image/png");
    if (!result.startsWith("data:image/png")) throw new Error("图片导出失败");
    return result;
}

const dimensions = (image: HTMLImageElement): PixelSize => ({ width: image.naturalWidth, height: image.naturalHeight });

export async function cropDataUrl(source: string, selection?: ImageCropRect): Promise<string> {
    const picture = await loadRasterImage(source);
    const region = resolveCropPixels(dimensions(picture), selection);
    return renderPng(picture, { region, output: { width: region.width, height: region.height }, sampling: "nearest" });
}

export async function splitDataUrl(source: string, grid: ImageSplitParams): Promise<ImageSplitPiece[]> {
    const picture = await loadRasterImage(source);
    return planImageTiles(dimensions(picture), grid).map((region) => ({
        row: region.row,
        column: region.column,
        dataUrl: renderPng(picture, { region, output: { width: region.width, height: region.height }, sampling: "nearest" }),
    }));
}

export async function upscaleDataUrl(source: string, options: ImageUpscaleParams): Promise<string> {
    if (!["nearest", "bilinear", "high"].includes(options.algorithm)) throw new RangeError("不支持的图片插值方式");
    const picture = await loadRasterImage(source);
    const size = dimensions(picture);
    return renderPng(picture, {
        region: { ...size, x: 0, y: 0 },
        output: resolveUpscaleSize(size.width, size.height, options.targetLongEdge),
        sampling: options.algorithm,
    });
}
