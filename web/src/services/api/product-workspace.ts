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
    points?: number;
    user?: ProductCurrentWorkspace;
    account?: ProductCurrentWorkspace;
};

export function getProductCurrentWorkspace() {
    return productHttp.get<ProductCurrentWorkspace>("/workspace/current");
}

export type ProductTeam = {
    id?: number | string;
    teamId?: number | string;
    teamName?: string;
    name?: string;
    teamAvatarUrl?: string;
    avatarUrl?: string;
    role?: "owner" | "member" | string;
};

export function createProductTeam(input: { teamName: string; teamAvatarUrl?: string }) {
    return productHttp.post<ProductTeam>("/workspace/teams", input);
}

export type ProductWorkspaceAccount = ProductCurrentWorkspace & {
    accountId?: number | string;
    accountName?: string;
    role?: "owner" | "member" | string;
    workspaceAvatarUrl?: string;
};

export function listProductWorkspaceAccounts() {
    return productHttp.get<ProductWorkspaceAccount[] | { accounts?: ProductWorkspaceAccount[]; list?: ProductWorkspaceAccount[] }>("/workspace/accounts").then((result) => Array.isArray(result) ? result : result.accounts || result.list || []);
}

export type ProductWorkspaceSwitchSession = {
    token: string;
    tokenType?: string;
    expireAt?: string;
    accountId?: number | string;
    accountName?: string;
    workspaceType?: string;
};

export function switchProductWorkspace(accountId: number | string) {
    return productHttp.post<ProductWorkspaceSwitchSession>("/workspace/switch", { accountId });
}

