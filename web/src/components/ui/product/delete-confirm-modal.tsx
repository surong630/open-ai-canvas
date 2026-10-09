import closeIcon from "@/assets/team/modal-close.svg";
import { AppModal } from "@/components/ui/product/app-modal";

import "./delete-confirm-modal.css";

export type DeleteConfirmModalProps = {
    open: boolean;
    message?: string;
    confirming?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function DeleteConfirmModal({ open, message = "确认执行此操作", confirming = false, onCancel, onConfirm }: DeleteConfirmModalProps) {
    return (
        <AppModal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={604}
            centered
            flush
            closeIcon={<img src={closeIcon} alt="" />}
            className="product-delete-confirm-modal"
        >
            <section className="product-delete-confirm-modal__shell" aria-labelledby="product-delete-confirm-modal-title">
                <header className="product-delete-confirm-modal__header">
                    <h2 id="product-delete-confirm-modal-title">提示</h2>
                </header>
                <p>{message}</p>
                <footer>
                    <button type="button" disabled={confirming} className="product-delete-confirm-modal__no" onClick={onCancel}>否</button>
                    <button type="button" disabled={confirming} className="product-delete-confirm-modal__yes" onClick={onConfirm}>{confirming ? "处理中" : "是"}</button>
                </footer>
            </section>
        </AppModal>
    );
}
