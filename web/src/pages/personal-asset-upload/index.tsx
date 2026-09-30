import { useState } from "react";

import {
    LanhuAssetUploadModal,
    type LanhuAssetUploadValue,
} from "./asset-upload-modal";
import { LanhuFolderEditorModal } from "./folder-editor-modal";

import "./page.css";

export type PersonalAssetUploadPageProps = {
    onUpload?: (value: LanhuAssetUploadValue) => void | Promise<void>;
    onCreateFolder?: (name: string) => void | Promise<void>;
};

const defaultFolders = [
    { label: "未分类", value: "uncategorized" },
    { label: "图片素材", value: "images" },
    { label: "视频素材", value: "videos" },
];

const defaultTags = [
    { label: "常用", value: "frequent" },
    { label: "待处理", value: "pending" },
];

export default function PersonalAssetUploadPage({
    onUpload,
    onCreateFolder,
}: PersonalAssetUploadPageProps) {
    const [uploadOpen, setUploadOpen] = useState(true);
    const [folderOpen, setFolderOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [savingUpload, setSavingUpload] = useState(false);
    const [savingFolder, setSavingFolder] = useState(false);

    const saveUpload = async (value: LanhuAssetUploadValue) => {
        setSavingUpload(true);
        try {
            await onUpload?.(value);
            setUploadOpen(false);
        } finally {
            setSavingUpload(false);
        }
    };

    const saveFolder = async () => {
        const name = folderName.trim();
        if (!name) return;
        setSavingFolder(true);
        try {
            await onCreateFolder?.(name);
            setFolderOpen(false);
            setFolderName("");
        } finally {
            setSavingFolder(false);
        }
    };

    return (
        <main className="personal-asset-upload-page">
            <div className="personal-asset-upload-page-actions">
                <button type="button" onClick={() => setUploadOpen(true)}>上传资产</button>
                <button type="button" onClick={() => setFolderOpen(true)}>新建文件夹</button>
            </div>

            <LanhuAssetUploadModal
                open={uploadOpen}
                folders={defaultFolders}
                tags={defaultTags}
                saving={savingUpload}
                onCancel={() => setUploadOpen(false)}
                onSave={saveUpload}
            />

            <LanhuFolderEditorModal
                open={folderOpen}
                mode="create"
                value={folderName}
                saving={savingFolder}
                onChange={setFolderName}
                onCancel={() => setFolderOpen(false)}
                onSave={saveFolder}
            />
        </main>
    );
}

export { LanhuAssetUploadModal } from "./asset-upload-modal";
export type {
    LanhuAssetUploadOption,
    LanhuAssetUploadModalProps,
    LanhuAssetUploadValue,
} from "./asset-upload-modal";
export { LanhuFolderEditorModal } from "./folder-editor-modal";
export { LanhuTagManagerModal } from "./tag-manager-modal";
export type { LanhuTagManagerModalProps, PersonalAssetTag } from "./tag-manager-modal";
export { DeleteTagConfirmModal } from "./delete-tag-confirm-modal";
export type { DeleteTagConfirmModalProps } from "./delete-tag-confirm-modal";
