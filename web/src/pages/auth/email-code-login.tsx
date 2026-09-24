import { App } from "antd";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { getAuthSession, getAuthSettings } from "@/services/api/auth";
import { emptyVerification, loginVerification, startVerification } from "@/services/api/verification";
import { brandStudioLabel, useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";

import "./email-code-login.css";

export default function EmailCodeLoginPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { message } = App.useApp();
    const appearance = useAppearanceStore((state) => state.appearance);
    const user = useUserStore((state) => state.user);
    const hydrated = useUserStore((state) => state.hydrated);
    const sendInFlight = useRef(false);
    const [email, setEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [ticket, setTicket] = useState("");
    const [remaining, setRemaining] = useState(0);
    const [sending, setSending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [emailLoginEnabled, setEmailLoginEnabled] = useState<boolean | null>(null);
    const [videoFailed, setVideoFailed] = useState(false);
    const [posterFailed, setPosterFailed] = useState(false);
    const next = safeNext(params.get("next"));

    useEffect(() => {
        if (hydrated && user) navigate(next, { replace: true });
    }, [hydrated, navigate, next, user]);

    useEffect(() => {
        void getAuthSettings()
            .then((settings) => setEmailLoginEnabled(settings.emailLogin))
            .catch((error) => {
                console.warn("读取邮箱验证码登录配置失败", error);
                setEmailLoginEnabled(false);
            });
    }, []);

    useEffect(() => {
        if (remaining <= 0) return;
        const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [remaining]);

    useEffect(() => {
        setVideoFailed(false);
        setPosterFailed(false);
    }, [appearance.authVideoPosterUrl, appearance.authVideoUrl]);

    const changeEmail = (value: string) => {
        setEmail(value);
        setTicket("");
        setEmailCode("");
    };

    const sendCode = async () => {
        if (sendInFlight.current || remaining > 0) return;
        const normalizedEmail = email.trim().toLowerCase();
        if (!isEmail(normalizedEmail)) {
            message.warning("请输入正确的邮箱账号");
            return;
        }
        if (!emailLoginEnabled) {
            message.warning(emailLoginEnabled === null ? "正在读取登录配置" : "管理员暂未开启邮箱验证码登录");
            return;
        }
        sendInFlight.current = true;
        setSending(true);
        setRemaining(60);
        setTicket("");
        setEmailCode("");
        try {
            const result = await startVerification({ purpose: "login", method: "email", email: normalizedEmail });
            setEmail(normalizedEmail);
            setTicket(result.ticket);
            setRemaining(result.retryAfter);
            message.success("如该邮箱已验证且账号可用，验证码将发送至该邮箱");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "发送失败，请稍后重试");
        } finally {
            setSending(false);
            sendInFlight.current = false;
        }
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!ticket) {
            message.warning("请先获取本次登录验证码");
            return;
        }
        if (emailCode.length !== 6) {
            message.warning("请输入 6 位邮件验证码");
            return;
        }
        setSubmitting(true);
        try {
            await loginVerification({ ...emptyVerification, email: email.trim().toLowerCase(), emailCode, ticket });
            const { applyUserSession } = await import("@/lib/user-session");
            await applyUserSession(await getAuthSession());
            message.success("登录成功");
            navigate(next, { replace: true });
        } catch (error) {
            message.error(error instanceof Error ? error.message : "登录失败");
        } finally {
            setSubmitting(false);
        }
    };

    const hasVideo = Boolean(appearance.authVideoUrl && !videoFailed);
    const hasPoster = Boolean(appearance.authVideoPosterUrl && !posterFailed);

    return (
        <main className="email-code-login">
            <section className="email-code-login__media" aria-label={`${appearance.brandName}登录视频`}>
                {hasVideo ? (
                    <video
                        className="email-code-login__media-content"
                        src={appearance.authVideoUrl}
                        poster={hasPoster ? appearance.authVideoPosterUrl : undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onError={() => setVideoFailed(true)}
                    />
                ) : hasPoster ? (
                    <img className="email-code-login__media-content" src={appearance.authVideoPosterUrl} alt="" onError={() => setPosterFailed(true)} />
                ) : (
                    <div className="email-code-login__placeholder" aria-label="视频播放区域">
                        <span>视频播放区域</span>
                    </div>
                )}
                <div className="email-code-login__media-shade" aria-hidden />
                <div className="email-code-login__brand">
                    <span className="email-code-login__brand-mark" aria-hidden />
                    <span><strong>{appearance.brandName}</strong><small>{brandStudioLabel(appearance)}</small></span>
                </div>
                <div className="email-code-login__media-copy">
                    <span>AI CREATIVE WORKSPACE</span>
                    <h2>{appearance.authHeroTitle || "让灵感进入创作现场"}</h2>
                    {appearance.authHeroDescription ? <p>{appearance.authHeroDescription}</p> : null}
                </div>
            </section>

            <section className="email-code-login__panel">
                <div className="email-code-login__ambient" aria-hidden><i /><i /><i /></div>
                <form className="email-code-login__form" onSubmit={submit}>
                    <header className="email-code-login__heading">
                        <span><i /> SECURE ACCESS</span>
                        <h1>登录创作空间</h1>
                        <p>使用邮箱验证码安全进入工作台</p>
                    </header>

                    <label className="email-code-login__field" htmlFor="email-code-login-account">
                        <span>邮箱账号</span>
                        <input
                            id="email-code-login-account"
                            type="email"
                            value={email}
                            onChange={(event) => changeEmail(event.target.value)}
                            placeholder="请输入邮箱账号"
                            autoComplete="email"
                            disabled={sending || submitting}
                            required
                        />
                    </label>

                    <label className="email-code-login__field" htmlFor="email-code-login-code">
                        <span>验证码</span>
                        <span className="email-code-login__code-row">
                            <input
                                id="email-code-login-code"
                                value={emailCode}
                                onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="请输入验证码"
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                disabled={sending || submitting}
                                required
                            />
                            <button type="button" onClick={() => void sendCode()} disabled={sending || submitting || remaining > 0 || emailLoginEnabled !== true}>
                                {sending ? "正在发送" : remaining > 0 ? `${remaining} 秒` : "获取验证码"}
                            </button>
                        </span>
                    </label>

                    <button className="email-code-login__submit" type="submit" disabled={submitting || emailLoginEnabled !== true}>
                        <span>{submitting ? "正在验证身份…" : "进入工作台"}</span>
                        <i aria-hidden>→</i>
                    </button>

                    {emailLoginEnabled === false ? <p className="email-code-login__status" role="status">管理员暂未开启邮箱验证码登录</p> : null}
                </form>
                <p className="email-code-login__security"><i aria-hidden /> 验证信息经加密通道传输</p>
            </section>
        </main>
    );
}

function safeNext(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
    return value;
}

function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
