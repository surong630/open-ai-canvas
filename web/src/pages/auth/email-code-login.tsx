import { App } from "antd";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { loginProductWithEmail, sendProductEmailCaptcha } from "@/services/api/product-auth";
import { useAppearanceStore } from "@/stores/use-appearance-store";
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
    const [remaining, setRemaining] = useState(0);
    const [sending, setSending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    const [posterFailed, setPosterFailed] = useState(false);
    const next = safeNext(params.get("next"));

    useEffect(() => {
        if (hydrated && user) navigate(next, { replace: true });
    }, [hydrated, navigate, next, user]);

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
        setEmailCode("");
    };

    const sendCode = async () => {
        if (sendInFlight.current || remaining > 0) return;
        const normalizedEmail = email.trim().toLowerCase();
        if (!isEmail(normalizedEmail)) {
            message.warning("请输入正确的邮箱账号");
            return;
        }
        sendInFlight.current = true;
        setSending(true);
        setRemaining(60);
        setEmailCode("");
        try {
            await sendProductEmailCaptcha(normalizedEmail);
            setEmail(normalizedEmail);
            message.success("验证码已发送，请查收邮箱");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "发送失败，请稍后重试");
        } finally {
            setSending(false);
            sendInFlight.current = false;
        }
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (emailCode.length !== 6) {
            message.warning("请输入 6 位邮件验证码");
            return;
        }
        setSubmitting(true);
        try {
            await loginProductWithEmail({ email: email.trim().toLowerCase(), captcha: emailCode });
            message.success("登录成功");
            // 二开接口当前只返回 token/workspace，不返回源仓库所需的用户 session，
            // 因此暂不调用源仓库的 applyUserSession，避免覆盖二开 token。
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
            </section>

            <section className="email-code-login__panel">
                <form className="email-code-login__form" onSubmit={submit}>
                    <header className="email-code-login__heading">
                        <h1>欢迎登录</h1>
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
                            <button type="button" onClick={() => void sendCode()} disabled={sending || submitting || remaining > 0}>
                                {sending ? "正在发送" : remaining > 0 ? `${remaining} 秒` : "获取验证码"}
                            </button>
                        </span>
                    </label>

                    <button className="email-code-login__submit" type="submit" disabled={submitting}>
                        <span>{submitting ? "正在验证身份…" : "登录/注册"}</span>
                    </button>

                </form>
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
