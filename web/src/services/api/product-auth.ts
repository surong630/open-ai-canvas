import { productHttp, setProductAccessToken, clearProductAccessToken } from "@/services/api/product-request";

export type ProductEmailLoginInput = {
    email: string;
    captcha: string;
};

export type ProductAuthSession = {
    token: string;
    tokenType: string;
    expireAt: string;
    workspaceId: number | string;
    workspaceType: string;
    workspaceName: string;
};

/** 向二开认证服务发送邮箱登录验证码。 */
export function sendProductEmailCaptcha(email: string) {
    return productHttp.post<Record<string, never>>("/auth/email/captcha", { email });
}

/** 使用邮箱验证码登录；成功后自动为后续二开请求注入 Authorization。 */
export async function loginProductWithEmail(input: ProductEmailLoginInput) {
    const session = await productHttp.post<ProductAuthSession>("/auth/login/email", input);
    setProductAccessToken(session);
    return session;
}

export function logoutProduct() {
    clearProductAccessToken();
}

