import { App, Pagination, Table, type TableColumnsType } from "antd";
import { Copy, Edit3, UsersRound, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";

import creditNavIcon from "@/assets/team-invite/icon-money-normal@2x.png";
import { CreateTeamModal, type CreateTeamDraft } from "@/components/layout/create-team-modal";
import { UserAvatar } from "@/components/layout/user-avatar";
import { useUserStore } from "@/stores/use-user-store";
import balanceIcon from "@/assets/credits/core-icon-number@2x.png";
import pageDropIcon from "@/assets/credits/icon-page-drop@2x.png";
import pageLeftDisabled from "@/assets/credits/page-left-disabled@2x.png";
import pageRight from "@/assets/credits/page-right@2x.png";

import "./team-members.css";
import "../credits/credits-page.css";
import { DissolveTeamModal } from "./dissolve-team-modal";
import { EditMemberRemarkModal } from "./edit-member-remark-modal";
import { TransferTeamOwnerModal } from "./transfer-team-owner-modal";

type Member = { id: string; name: string; username?: string; email: string; usage: string; role: "owner" | "member" };

const members: Member[] = [
    { id: "member-1", name: "#用户备注名#", username: "用户518b28", email: "123654215@qq.com", usage: "1234/400000", role: "owner" },
    { id: "member-2", name: "用户518b28", email: "873654215@qq.com", usage: "21523/1245452", role: "member" },
];

export default function TeamMembersPage() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { teamId = "team" } = useParams();
    const user = useUserStore((state) => state.user);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [jumpPage, setJumpPage] = useState("1");
    const [teamName, setTeamName] = useState("测试团队");
    const [editTeamOpen, setEditTeamOpen] = useState(false);
    const [dissolveTeamOpen, setDissolveTeamOpen] = useState(false);
    const [memberRows, setMemberRows] = useState(members);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [transferOwnerOpen, setTransferOwnerOpen] = useState(false);
    const columns: TableColumnsType<Member> = [
        { title: "成员", key: "member", render: (_, member) => <div className="team-members-page__member"><UserAvatar user={user!} className="team-members-page__member-avatar" fallbackVariant="product" /><span><strong>{member.name}</strong>{member.username ? <small>{member.username}</small> : null}</span></div> },
        { title: "邮箱", dataIndex: "email", key: "email" },
        { title: "月积分消耗/额度", dataIndex: "usage", key: "usage" },
        { title: "角色", key: "role", render: (_, member) => <span className={`team-members-page__role is-${member.role}`}>{member.role === "owner" ? "团队负责人" : "团队成员"}</span> },
        { title: "操作", key: "actions", render: (_, member) => <div className="team-members-page__actions"><button type="button" onClick={() => setEditingMember(member)}>修改备注</button><button type="button" onClick={() => member.role === "owner" ? setTransferOwnerOpen(true) : setDissolveTeamOpen(true)}>{member.role === "owner" ? "转让团队负责人" : "解散团队"}</button></div> },
    ];
    const jumpToPage = () => setPage(Math.max(1, Number.parseInt(jumpPage || "1", 10)));

    return (
        <main className="team-members-page">
            <aside className="team-members-page__sidebar" aria-label="团队设置">
                <button type="button" className="is-active" aria-current="page">
                    <UsersRound aria-hidden="true" />
                    成员管理
                </button>
                <button type="button" onClick={() => navigate(`/team-settings/${encodeURIComponent(teamId)}/credits`)}>
                    <img src={creditNavIcon} alt="" />
                    积分管理
                </button>
            </aside>
            <section className="team-members-page__workspace">
                <header className="team-members-page__header">
                    <button type="button" className="team-members-page__dissolve" onClick={() => setDissolveTeamOpen(true)}>
                        解散团队
                    </button>
                    <button type="button" aria-label="关闭成员管理" onClick={() => navigate("/home")}>
                        <X aria-hidden="true" />
                    </button>
                </header>
                <div className="team-members-page__content">
                    <div className="team-members-page__team-heading">
                        <UserAvatar user={user!} className="team-members-page__team-avatar" fallbackVariant="product" />
                        <div>
                            <div className="team-members-page__team-name">
                                <button type="button" className="team-members-page__edit-team" onClick={() => setEditTeamOpen(true)}> {teamName} <Edit3 aria-hidden="true" /></button>
                            </div>
                            <div className="team-members-page__team-id">
                                团队ID：58eddbdc1a2d22222222222222222222 <Copy aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                    <div className="team-members-page__balance">
                        <img src={balanceIcon} alt="" />
                        <strong>10000</strong>
                        <em>当前团队剩余积分</em>
                    </div>
                    <div className="team-members-page__toolbar">
                        <button type="button" onClick={() => message.info("成员积分配置功能尚未接入")}>
                            成员积分配置
                        </button>
                        <button type="button" onClick={() => message.info("待处理申请功能尚未接入")}>
                            待处理申请 <b>1</b>
                        </button>
                        <button type="button" className="is-primary" onClick={() => message.info("邀请成员功能尚未接入")}>
                            邀请成员
                        </button>
                    </div>
                    <Table<Member> className="credits-page__table" columns={columns} dataSource={memberRows} pagination={false} rowKey="id" tableLayout="fixed" />
                    <footer className="credits-page__footer">
                        <Pagination current={page} pageSize={pageSize} pageSizeOptions={[20, 50, 100]} total={5} showSizeChanger={{ className: "credits-page__size-select", suffixIcon: <img src={pageDropIcon} alt="" />, classNames: { popup: { root: "credits-page__size-menu" } } }} showTotal={(total) => `共${total}笔`} itemRender={(_, type, originalElement) => type === "prev" ? <img className="credits-page__page-arrow" src={pageLeftDisabled} alt="上一页" /> : type === "next" ? <img className="credits-page__page-arrow" src={pageRight} alt="下一页" /> : originalElement} onChange={(nextPage, nextPageSize) => { setPage(nextPageSize !== pageSize ? 1 : nextPage); setPageSize(nextPageSize); }} />
                        <label className="credits-page__quick-jumper"><span>跳至</span><input type="text" inputMode="numeric" aria-label="跳转页码" value={jumpPage} onChange={(event) => setJumpPage(event.target.value.replace(/\D/g, ""))} onBlur={jumpToPage} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); jumpToPage(); } }} /><span>页</span></label>
                    </footer>
                </div>
            </section>
            <CreateTeamModal
                open={editTeamOpen}
                title="编辑团队信息"
                initialName={teamName}
                showNotice={false}
                onCancel={() => setEditTeamOpen(false)}
                onConfirm={(draft: CreateTeamDraft) => { setTeamName(draft.name); setEditTeamOpen(false); }}
            />
            <DissolveTeamModal open={dissolveTeamOpen} onCancel={() => setDissolveTeamOpen(false)} onConfirm={() => { setDissolveTeamOpen(false); message.info("解散团队功能尚未接入"); }} />
            <EditMemberRemarkModal
                open={Boolean(editingMember)}
                username={editingMember?.username ?? ""}
                remark={editingMember?.name ?? ""}
                onCancel={() => setEditingMember(null)}
                onConfirm={(remark) => {
                    if (!editingMember) return;
                    setMemberRows((current) => current.map((member) => member.id === editingMember.id ? { ...member, name: remark } : member));
                    setEditingMember(null);
                }}
            />
            <TransferTeamOwnerModal
                open={transferOwnerOpen}
                members={memberRows}
                onCancel={() => setTransferOwnerOpen(false)}
                onConfirm={(memberId) => {
                    setMemberRows((current) => current.map((member) => ({ ...member, role: member.id === memberId ? "owner" : "member" })));
                    setTransferOwnerOpen(false);
                    message.success("团队负责人已转让");
                }}
            />
        </main>
    );
}
