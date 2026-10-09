import closeIcon from "@/assets/team/modal-close.svg";
import { AppModal } from "@/components/ui/product/app-modal";
import { XingpeiSelect } from "@/components/ui/product/xingpei-select";
import { useState } from "react";

import { CompactMemberOption, MemberOption } from "./transfer-team-owner-modal";
import "./remove-member-modal.css";

type RemoveMember = { id: string; name: string; username?: string; email: string; role: "owner" | "member" };

export function RemoveMemberModal({ open, members, initialMemberId, onCancel, onConfirm }: { open: boolean; members: RemoveMember[]; initialMemberId?: string; onCancel: () => void; onConfirm: (memberId: string) => void }) {
    const candidates = members.filter((member) => member.role !== "owner");
    const [selected, setSelected] = useState(initialMemberId ?? candidates[0]?.id);
    const selectedMember = candidates.find((member) => member.id === selected);
    return (
        <AppModal open={open} title={null} footer={null} width={420} centered flush closeIcon={<img src={closeIcon} alt="" />} rootClassName="remove-member-modal" onCancel={onCancel}>
            <form className="remove-member-modal__shell" onSubmit={(event) => { event.preventDefault(); if (selected) onConfirm(selected); }}>
                <header><h2>移除成员</h2></header>
                <div className="remove-member-modal__body">
                    <p className="remove-member-modal__description">移出后此人名下项目与资产将转交给指定承接人，不影响团队使用。</p>
                    <label><span>将资产转移给：</span><XingpeiSelect value={selected} options={candidates.map((member) => ({ value: member.id, label: member.name }))} optionRender={(option) => { const member = candidates.find((entry) => entry.id === option.value); return member ? <MemberOption member={member} /> : option.label; }} labelRender={() => selectedMember ? <CompactMemberOption member={selectedMember} /> : null} onChange={(value) => setSelected(String(value))} /></label>
                </div>
                <footer><button type="button" onClick={onCancel}>取消</button><button type="submit" disabled={!selected}>保存</button></footer>
            </form>
        </AppModal>
    );
}
