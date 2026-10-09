import closeIcon from "@/assets/team/modal-close.svg";
import { AppModal } from "@/components/ui/product/app-modal";
import { XingpeiSelect } from "@/components/ui/product/xingpei-select";
import { UserRound } from "lucide-react";
import { useState } from "react";

import "./transfer-team-owner-modal.css";

type TransferTeamOwnerModalProps = {
    open: boolean;
    members: Array<{ id: string; name: string; username?: string; role: "owner" | "member" }>;
    onCancel: () => void;
    onConfirm: (memberId: string) => void;
};

export function TransferTeamOwnerModal({ open, members, onCancel, onConfirm }: TransferTeamOwnerModalProps) {
    const candidates = members;
    return (
        <AppModal
            open={open}
            title={null}
            footer={null}
            width={420}
            centered
            flush
            closeIcon={<img src={closeIcon} alt="" />}
            rootClassName="transfer-team-owner-modal"
            onCancel={onCancel}
        >
            <TransferTeamOwnerForm key={open ? "open" : "closed"} candidates={candidates} onCancel={onCancel} onConfirm={onConfirm} />
        </AppModal>
    );
}

function TransferTeamOwnerForm({ candidates, onCancel, onConfirm }: { candidates: TransferTeamOwnerModalProps["members"]; onCancel: () => void; onConfirm: (memberId: string) => void }) {
    const [selected, setSelected] = useState(candidates.find((member) => member.role === "owner")?.id ?? candidates[0]?.id);
    return (
        <form className="transfer-team-owner-modal__shell" onSubmit={(event) => { event.preventDefault(); if (selected) onConfirm(selected); }}>
            <header className="transfer-team-owner-modal__header"><h2>转让团队负责人</h2></header>
            <div className="transfer-team-owner-modal__body">
                <label>
                    <span>选择团队成员</span>
                    <XingpeiSelect
                        value={selected}
                        options={candidates.map((member) => ({ value: member.id, label: member.name }))}
                        optionRender={(option) => {
                            const member = candidates.find((entry) => entry.id === option.value);
                            return member ? <MemberOption member={member} /> : option.label;
                        }}
                        labelRender={(option) => {
                            const member = candidates.find((entry) => entry.id === option.value);
                            return member ? <CompactMemberOption member={member} /> : option.label;
                        }}
                        popupClassName="transfer-team-owner-modal__select-menu"
                        open={undefined}
                        onChange={(value) => setSelected(String(value))}
                    />
                </label>
                <p>转让后，你将不再是团队负责人。</p>
            </div>
            <footer className="transfer-team-owner-modal__footer">
                <button type="button" className="transfer-team-owner-modal__cancel" onClick={onCancel}>取消</button>
                <button type="submit" className="transfer-team-owner-modal__confirm" disabled={!selected}>确认</button>
            </footer>
        </form>
    );
}

export function MemberOption({ member }: { member: TransferTeamOwnerModalProps["members"][number] }) {
    return <span className="transfer-team-owner-modal__member-option"><span className="transfer-team-owner-modal__avatar"><UserRound aria-hidden="true" /></span><span className="transfer-team-owner-modal__member-copy"><strong>{member.name}</strong><small>{member.username ?? ""}</small></span>{member.role === "owner" ? <em>团队负责人</em> : null}</span>;
}

export function CompactMemberOption({ member }: { member: TransferTeamOwnerModalProps["members"][number] }) {
    return <span className="transfer-team-owner-modal__member-option"><span className="transfer-team-owner-modal__avatar"><UserRound aria-hidden="true" /></span><strong>{member.name}</strong></span>;
}
