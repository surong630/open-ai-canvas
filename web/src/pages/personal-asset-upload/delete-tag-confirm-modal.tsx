import { X } from "lucide-react";

import { AppModal } from "@/components/ui/product/app-modal";

import "./delete-tag-confirm-modal.css";

export type DeleteTagConfirmModalProps = {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function DeleteTagConfirmModal({ open, onCancel, onConfirm }: DeleteTagConfirmModalProps) {
    return (
        <AppModal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={604}
            centered
            flush
            closeIcon={<X size={12} />}
            className="lanhu-delete-tag-confirm-modal"
        >
            <section className="lanhu-delete-tag-confirm-shell" aria-labelledby="lanhu-delete-tag-confirm-title">
                <header className="lanhu-delete-tag-confirm-header">
                    <h2 id="lanhu-delete-tag-confirm-title">提示</h2>
                </header>
                <p>标签删除后，该标签将在关联的文件上进行删除，是否继续执行该操作？</p>
                <footer>
                    <button type="button" className="lanhu-delete-tag-confirm-no" onClick={onCancel}>否</button>
                    <button type="button" className="lanhu-delete-tag-confirm-yes" onClick={onConfirm}>是</button>
                </footer>
            </section>
        </AppModal>
    );
}
