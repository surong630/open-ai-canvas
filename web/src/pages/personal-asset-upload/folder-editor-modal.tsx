import { X } from "lucide-react";

import { AppModal } from "@/components/ui/product/app-modal";

import "./folder-editor-modal.css";

export type LanhuFolderEditorModalProps = {
    open: boolean;
    mode: "create" | "rename";
    value: string;
    saving?: boolean;
    onChange: (value: string) => void;
    onCancel: () => void;
    onSave: () => void;
};

export function LanhuFolderEditorModal({
    open,
    mode,
    value,
    saving = false,
    onChange,
    onCancel,
    onSave,
}: LanhuFolderEditorModalProps) {
    const title = mode === "create" ? "新建文件夹" : "重命名文件夹";

    return (
        <AppModal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={604}
            centered
            flush
            closeIcon={<X size={12} />}
            className="lanhu-folder-editor-modal"
        >
            <form
                className="lanhu-folder-editor-shell"
                aria-labelledby="lanhu-folder-editor-title"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!saving && value.trim()) onSave();
                }}
            >
                <header className="lanhu-folder-editor-header">
                    <h2 id="lanhu-folder-editor-title">{title}</h2>
                </header>

                <label className="lanhu-folder-editor-field">
                    <span>*文件夹名称</span>
                    <input
                        autoFocus
                        maxLength={40}
                        value={value}
                        placeholder="请输入文件夹名称"
                        onChange={(event) => onChange(event.currentTarget.value)}
                    />
                </label>

                <footer className="lanhu-folder-editor-footer">
                    <button type="button" className="lanhu-folder-editor-cancel" disabled={saving} onClick={onCancel}>取消</button>
                    <button type="submit" className="lanhu-folder-editor-save" disabled={saving || !value.trim()}>{saving ? "保存中" : "保存"}</button>
                </footer>
            </form>
        </AppModal>
    );
}

