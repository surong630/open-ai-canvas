import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { request, type BackendEnvelope, type HttpRequestConfig } from "@/services/api/request";

/**
 * 二开后端的独立请求入口。
 *
 * 二开接口与源仓库的 `/api` 接口共存，因此不能复用源仓库的 apiClient，
 * 否则不同后端的 baseURL、认证和错误协议会互相污染。二开业务模块只应
 * 从本文件导入 productHttp。
 */
// 开发环境默认走 Vite `/product-api` 代理，避免浏览器直接跨域访问二开服务。
// 生产部署可通过 VITE_PRODUCT_API_BASE_URL 指向同源反代或正式服务地址。
export const productApiBaseURL = import.meta.env.VITE_PRODUCT_API_BASE_URL || "/product-api";

export const productApiClient = axios.create({
    baseURL: productApiBaseURL,
    withCredentials: true,
});

const PRODUCT_ACCESS_TOKEN_KEY = "product_access_token";
let productAccessToken: { token: string; tokenType: string; expireAt?: string } | null = readProductAccessToken();

productApiClient.interceptors.request.use((config) => {
    if (productAccessToken?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `${productAccessToken.tokenType || "Bearer"} ${productAccessToken.token}`;
    }
    return config;
});

// 二开服务的成功业务码与源仓库不完全一致：当前同时存在 0 和 200。
// 在二开边界统一成源请求解包器使用的 0，避免成功响应被误判为异常。
productApiClient.interceptors.response.use((response) => {
    const envelope = response.data as { code?: unknown } | undefined;
    if (envelope && (envelope.code === 200 || (response.status >= 200 && response.status < 300 && envelope.code === undefined))) {
        response.data = { ...envelope, code: 0 };
    }
    return response;
});

export function setProductAccessToken(session: { token: string; tokenType?: string; expireAt?: string }) {
    productAccessToken = { token: session.token, tokenType: session.tokenType || "Bearer", expireAt: session.expireAt };
    try {
        localStorage.setItem(PRODUCT_ACCESS_TOKEN_KEY, JSON.stringify(productAccessToken));
    } catch {
        // 隐私模式或禁用存储时仍保留当前页面内的内存 token。
    }
}

export function clearProductAccessToken() {
    productAccessToken = null;
    try {
        localStorage.removeItem(PRODUCT_ACCESS_TOKEN_KEY);
    } catch {
        // 存储不可用时无需额外处理。
    }
}

function readProductAccessToken() {
    try {
        const raw = localStorage.getItem(PRODUCT_ACCESS_TOKEN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { token?: unknown; tokenType?: unknown; expireAt?: unknown };
        if (typeof parsed.token !== "string" || !parsed.token) return null;
        const expireAt = typeof parsed.expireAt === "string" && parsed.expireAt ? parsed.expireAt : undefined;
        if (expireAt) {
            const expiresAt = Date.parse(expireAt);
            if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
                localStorage.removeItem(PRODUCT_ACCESS_TOKEN_KEY);
                return null;
            }
        }
        return { token: parsed.token, tokenType: typeof parsed.tokenType === "string" && parsed.tokenType ? parsed.tokenType : "Bearer", expireAt };
    } catch {
        return null;
    }
}

async function send<T>(method: string, url: string, data?: unknown, config?: HttpRequestConfig) {
    const { allowNotModified, ...axiosConfig } = config || {};
    return request<T>(
        productApiClient.request<BackendEnvelope<T>>({
            method,
            url,
            data,
            ...axiosConfig,
        }),
        { allowNotModified },
    );
}

/** 二开接口统一调用面；业务 API 不要直接创建 axios 实例。 */
export const productHttp = {
    get: <T>(url: string, config?: HttpRequestConfig) => send<T>("get", url, undefined, config),
    post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => send<T>("post", url, data, config),
    put: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => send<T>("put", url, data, config),
    patch: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => send<T>("patch", url, data, config),
    delete: <T>(url: string, config?: HttpRequestConfig) => send<T>("delete", url, undefined, config),
    async raw<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return productApiClient.request<T>(config);
    },
};

