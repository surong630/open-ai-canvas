import { App } from "antd";
import copy from "copy-to-clipboard";
import { X } from "lucide-react";
import { useMemo } from "react";

import { AppModal } from "@/components/ui/product/app-modal";

import type { ProductAccountTeam } from "./product-account-menu";
import "./invite-members-modal.css";

type InviteMembersModalProps = {
    team?: ProductAccountTeam;
    onClose: () => void;
};

export function InviteMembersModal({ team, onClose }: InviteMembersModalProps) {
    const { message } = App.useApp();
    const inviteLink = useMemo(() => {
        if (!team) return "";
        return `${window.location.origin}/team-invite/mock-${encodeURIComponent(team.id)}`;
    }, [team]);
    const expiresAt = useMemo(() => {
        if (!team) return "";
        const value = new Date();
        value.setDate(value.getDate() + 7);
        return value.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).replaceAll("/", "-");
    }, [team]);

    const copyLink = async () => {
        if (!inviteLink) return;
        if (await copy(inviteLink)) message.success("邀请链接已复制");
        else message.error("复制失败，请手动复制链接");
    };

    return (
        <AppModal
            flush
            centered
            open={Boolean(team)}
            width={604}
            title={null}
            footer={null}
            closable={false}
            onCancel={onClose}
            rootClassName="invite-members-modal"
        >
            <section className="invite-members-modal__shell" aria-label="邀请成员">
                <header className="invite-members-modal__header">
                    <h2>邀请成员</h2>
                    <button type="button" aria-label="关闭" onClick={onClose}><X aria-hidden="true" /></button>
                </header>
                <div className="invite-members-modal__body">
                    <div className="invite-members-modal__tabs">
                        <span>通过链接邀请</span>
                    </div>
                    <div className="invite-members-modal__link" title={inviteLink}>{inviteLink}</div>
                    <p>
                        将本链接发给需要加入团队的成员，成员申请并经由管理员审批后，即可加入团队<br />
                        链接有限期至：<strong>{expiresAt}</strong>
                    </p>
                    <button type="button" className="invite-members-modal__copy" onClick={() => void copyLink()}>复制链接</button>
                </div>
            </section>
        </AppModal>
    );
}
