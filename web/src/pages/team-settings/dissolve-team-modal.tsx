import { X } from "lucide-react";

import { AppModal } from "@/components/ui/product/app-modal";

import "./dissolve-team-modal.css";

type DissolveTeamModalProps = {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function DissolveTeamModal({ open, onCancel, onConfirm }: DissolveTeamModalProps) {
    return (
        <AppModal
            flush
            centered
            open={open}
            width={420}
            title={null}
            footer={null}
            closeIcon={<X aria-hidden="true" />}
            onCancel={onCancel}
            rootClassName="dissolve-team-modal"
        >
            <section className="dissolve-team-modal__shell" aria-labelledby="dissolve-team-modal-title">
                <header className="dissolve-team-modal__header">
                    <h2 id="dissolve-team-modal-title">确定要解散团队吗？</h2>
                </header>

                <div className="dissolve-team-modal__body">
                    <p>解散团队后,以下数据将被永久删除且无法找回:</p>
                    <ul>
                        <li><strong>团队资产</strong><span> — 建议提前下载到本地或转为个人资产</span></li>
                        <li><strong>团队积分</strong><span> — 建议使用完毕后再解散</span></li>
                    </ul>
                    <p>此操作不可撤销,请谨慎操作。</p>
                </div>

                <footer className="dissolve-team-modal__footer">
                    <button type="button" className="dissolve-team-modal__cancel" onClick={onCancel}>取消</button>
                    <button type="button" className="dissolve-team-modal__confirm" onClick={onConfirm}>确认</button>
                </footer>
            </section>
        </AppModal>
    );
}
