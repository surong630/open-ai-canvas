import { productHttp } from "@/services/api/product-request";

export type ProductProjectItem = {
    id: number | string;
    itemType: number;
    parentId?: number | string;
    name: string;
    coverUrl?: string;
    canvasId?: number | string;
    updateTime?: string;
};

/** 二开项目列表探测请求；暂不参与旧首页的数据渲染。 */
export function listProductProjects(options: { parentId?: number | string; keyword?: string; recycle?: boolean } = {}) {
    return productHttp.get<ProductProjectItem[]>("/projects", {
        params: {
            parentId: options.parentId,
            keyword: options.keyword,
            recycle: options.recycle,
        },
    });
}

/** 二开项目/文件夹创建请求；当前与源仓库创建流程并行调用。 */
export function createProductProject(input: { itemType: number; parentId?: number | string; name: string; coverUrl?: string }) {
    return productHttp.post<ProductProjectItem>("/projects", input);
}

/** 将二开项目或文件夹移入回收站。 */
export function deleteProductProject(projectId: number | string) {
    return productHttp.delete<Record<string, never>>(`/projects/${encodeURIComponent(String(projectId))}`);
}

/** 从二开回收站恢复单个项目或文件夹。 */
export function restoreProductProject(projectId: number | string) {
    return productHttp.post<ProductProjectItem>(`/projects/${encodeURIComponent(String(projectId))}/restore`);
}

/** 在同一事务中恢复多个二开项目或文件夹。 */
export function restoreProductProjects(projectIds: Array<number | string>) {
    return productHttp.post<ProductProjectItem[]>("/projects/restore", { ids: projectIds });
}

/** 重命名二开项目或文件夹。 */
export function renameProductProject(projectId: number | string, name: string) {
    return productHttp.patch<ProductProjectItem>(`/projects/${encodeURIComponent(String(projectId))}/name`, { name });
}

/** 将二开项目或文件夹移动到目标父文件夹。 */
export function moveProductProject(projectId: number | string, parentId?: number | string) {
    return productHttp.patch<ProductProjectItem>(`/projects/${encodeURIComponent(String(projectId))}/parent`, { parentId });
}

export type ProductFileUploadResult = { id?: number | string; url: string; thumbnailUrl?: string; originalName?: string; mimeType?: string; sizeBytes?: number };

/** 使用二开对象存储接口上传单个文件，返回对象存储 URL。 */
export function uploadProductFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    // `/tos/fileUpload` 保留了一个必填的兼容 id 参数，当前后端不会用它生成响应键。
    formData.append("id", file.name || `upload-${Date.now()}`);
    return productHttp.post<ProductFileUploadResult>("/tos/fileUpload", formData);
}

/** 更新二开项目或文件夹封面。 */
export function updateProductProjectCover(projectId: number | string, coverUrl: string) {
    return productHttp.patch<ProductProjectItem>(`/projects/${encodeURIComponent(String(projectId))}/cover`, { coverUrl });
}

