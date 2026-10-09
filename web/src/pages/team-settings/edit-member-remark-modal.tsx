import closeIcon from "@/assets/team/modal-close.svg";
import { AppModal } from "@/components/ui/product/app-modal";
import { XingpeiInput } from "@/components/ui/product/xingpei-input";
import { useEffect, useState } from "react";

import "./edit-member-remark-modal.css";

type EditMemberRemarkModalProps = {
    open: boolean;
    username: string;
    remark: string;
    onCancel: () => void;
    onConfirm: (remark: string) => void;
};

export function EditMemberRemarkModal({ open, username, remark, onCancel, onConfirm }: EditMemberRemarkModalProps) {
    const [draftRemark, setDraftRemark] = useState(remark);

    useEffect(() => {
        if (open) setDraftRemark(remark);
    }, [open, remark]);

    return (
        <AppModal
            open={open}
            title={null}
            footer={null}
            width={420}
            centered
            flush
            closeIcon={<img src={closeIcon} alt="" />}
            rootClassName="edit-member-remark-modal"
            onCancel={onCancel}
        >
            <form
                className="edit-member-remark-modal__shell"
                onSubmit={(event) => {
                    event.preventDefault();
                    onConfirm(draftRemark);
                }}
            >
                <header className="edit-member-remark-modal__header">
                    <h2>修改备注</h2>
                </header>
                <div className="edit-member-remark-modal__body">
                    <label>
                        <span>用户名</span>
                        <XingpeiInput value={username} disabled aria-label="用户名" />
                    </label>
                    <label>
                        <span>备注名</span>
                        <XingpeiInput rootClassName="team-settings-input" value={draftRemark} maxLength={30} autoFocus aria-label="备注名" onChange={(event) => setDraftRemark(event.target.value)} />
                    </label>
                </div>
                <footer className="edit-member-remark-modal__footer">
                    <button type="button" className="edit-member-remark-modal__cancel" onClick={onCancel}>取消</button>
                    <button type="submit" className="edit-member-remark-modal__confirm">保存</button>
                </footer>
            </form>
        </AppModal>
    );
}
