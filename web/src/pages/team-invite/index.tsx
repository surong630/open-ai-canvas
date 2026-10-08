import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useUserStore } from "@/stores/use-user-store";
import { UserAvatar } from "@/components/layout/user-avatar";
import homeIcon from "@/assets/team-invite/icon-homepage-selected@2x.png";
import projectIcon from "@/assets/team-invite/icon-project-normal@2x.png";
import moneyIcon from "@/assets/team-invite/icon-money-normal@2x.png";
import noticeIcon from "@/assets/team-invite/invite-icon-notice@2x.png";
import teamAvatars from "@/assets/team-invite/team-invite-avatars@2x.png";
import "./team-invite.css";

type InviteState = "invalid" | "login" | "ready" | "pending" | "joined";

export default function TeamInvitePage() {
    const { inviteToken = "" } = useParams();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const hydrated = useUserStore((state) => state.hydrated);
    const inviteKey = `team-invite:${inviteToken}`;
    const [submitted, setSubmitted] = useState(false);
    const validInvite = inviteToken.startsWith("mock-");
    const state = useMemo<InviteState>(() => {
        if (!validInvite) return "invalid";
        if (!hydrated || !user) return "login";
        if (submitted || sessionStorage.getItem(inviteKey) === "pending") return "pending";
        if (sessionStorage.getItem(inviteKey) === "joined") return "joined";
        return "ready";
    }, [hydrated, inviteKey, inviteToken, submitted, user, validInvite]);

    useEffect(() => {
        if (submitted) sessionStorage.setItem(inviteKey, "pending");
    }, [inviteKey, submitted]);

    const returnHome = () => navigate("/home");
    const login = () => navigate(`/email-login?next=${encodeURIComponent(`/team-invite/${inviteToken}`)}`);
    const join = () => setSubmitted(true);

    return (
        <main className="team-invite-page">
            <aside className="team-invite-page__sidebar">
                <h1>系统名称</h1>
                <nav aria-label="首页导航">
                    <a className="is-active" href="/home"><img src={homeIcon} alt="" />首页</a>
                    <a href="/canvas-projects"><img src={projectIcon} alt="" />项目</a>
                    <a href="/product-assets"><img src={moneyIcon} alt="" />资产</a>
                </nav>
            </aside>
            <section className="team-invite-page__content">
                <div className="team-invite-page__topbar">
                    {state === "invalid" || state === "login" ? <button type="button" className="team-invite-page__login" onClick={login}>注册/登录</button> : <><span className="team-invite-page__credits">⚡ 2400</span><UserAvatar user={user!} className="team-invite-page__avatar" fallbackVariant="product" /></>}
                </div>
                <div className={`team-invite-page__card is-${state}`} role="status">
                    {state === "invalid" ? <>
                        <img className="team-invite-page__status-icon" src={noticeIcon} alt="" />
                        <h2>邀请链接已失效</h2>
                        <p>该链接已失效，暂时无法申请加入团队</p>
                        <p className="is-note">请联系团队管理员，获取新的邀请链接。</p>
                        <button type="button" className="team-invite-page__button is-accent" onClick={returnHome}>返回首页</button>
                    </> : null}
                    {state === "login" ? <>
                        <img className="team-invite-page__avatars" src={teamAvatars} alt="" />
                        <h2>邀请你加入团队</h2>
                        <button type="button" className="team-invite-page__button is-accent" onClick={login}>登录</button>
                    </> : null}
                    {state === "ready" ? <>
                        <img className="team-invite-page__avatars" src={teamAvatars} alt="" />
                        <h2 className="is-team"><span className="team-name">测试团队</span> 邀请你入团队</h2>
                        <p>邀请人：用户f8b28</p>
                        <button type="button" className="team-invite-page__button is-accent" onClick={join}>加入团队</button>
                    </> : null}
                    {state === "pending" ? <>
                        <img className="team-invite-page__avatars" src={teamAvatars} alt="" />
                        <h2 className="is-team"><span className="team-name">测试团队</span> 邀请你入团队</h2>
                        <button type="button" className="team-invite-page__button is-pending" disabled>已申请加入</button>
                        <p className="is-pending">等待管理员审核</p>
                    </> : null}
                    {state === "joined" ? <>
                        <img className="team-invite-page__avatars" src={teamAvatars} alt="" />
                        <h2>你已加入团队，无需再次加入</h2>
                        <button type="button" className="team-invite-page__button is-accent" onClick={returnHome}>返回首页</button>
                    </> : null}
                </div>
            </section>
        </main>
    );
}
