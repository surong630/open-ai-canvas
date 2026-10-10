import { productHttp } from "@/services/api/product-request";

export type ProductCurrentWorkspace = {
    id?: number | string;
    userId?: number | string;
    username?: string;
    displayName?: string;
    nickname?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    workspaceId?: number | string;
    workspaceType?: string;
    workspaceName?: string;
    user?: ProductCurrentWorkspace;
    account?: ProductCurrentWorkspace;
};

export function getProductCurrentWorkspace() {
    return productHttp.get<ProductCurrentWorkspace>("/workspace/current");
}

