import { useEffect, useMemo, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import uploadAddIcon from "./assets/asset-upload-add.svg";
import uploadAudioPlaceholder from "./assets/asset-upload-audio-placeholder.svg";
import uploadAudioTypeIcon from "./assets/asset-upload-audio-type.svg";
import uploadImageTypeIcon from "./assets/asset-upload-image-type.svg";
import uploadVideoTypeIcon from "./assets/asset-upload-video-type.svg";
import { AppModal } from "@/components/ui/product/app-modal/app-modal";
import { AssetMetadataFields } from "@/components/ui/product/asset-metadata-fields";
import "./asset-upload-modal.css";

export type LanhuAssetUploadValue = {
    name: string;
    folderId?: string;
    tagIds?: string[];
    files: File[];
};

export type LanhuAssetUploadOption = {
    label: string;
    value: string;
};

export type LanhuAssetUploadModalProps = {
    open: boolean;
    folders?: LanhuAssetUploadOption[];
    tags?: LanhuAssetUploadOption[];
    initialFiles?: File[];
    initialFolderId?: string;
    saving?: boolean;
    onCancel: () => void;
    onSave: (value: LanhuAssetUploadValue) => void;
};

type PreviewItemProps = {
    file: File;
    onRemove: () => void;
};

const MAX_FILES = 20;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,video/mp4,audio/mpeg";
const EMPTY_INITIAL_FILES: File[] = [];
function getFileKind(file: File) {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "image";
}

function PreviewItem({ file, onRemove }: PreviewItemProps) {
    const kind = getFileKind(file);
    const previewUrl = useMemo(() => (
        kind === "image" || kind === "video" ? URL.createObjectURL(file) : undefined
    ), [file, kind]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <article className="lanhu-asset-upload-item">
            <div className="lanhu-asset-upload-thumbnail">
                {kind === "image" && previewUrl ? (
                    <img src={previewUrl} alt="" />
                ) : kind === "video" ? (
                    <>
                        <video src={previewUrl} muted preload="metadata" aria-hidden="true" />
                        <Play className="lanhu-asset-upload-video-play" aria-hidden="true" />
                    </>
                ) : (
                    <img src={uploadAudioPlaceholder} alt="" />
                )}
                <button type="button" onClick={onRemove} aria-label={`移除 ${file.name}`}>
                    <X aria-hidden="true" />
                </button>
            </div>
            <span title={file.name}>{file.name}</span>
        </article>
    );
}

export function LanhuAssetUploadModal({
    open,
    folders = [],
    tags = [],
    initialFiles = EMPTY_INITIAL_FILES,
    initialFolderId = "",
    saving = false,
    onCancel,
    onSave,
}: LanhuAssetUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [name, setName] = useState("");
    const [folderId, setFolderId] = useState("");
    const [tagIds, setTagIds] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        setFiles(initialFiles.slice(0, MAX_FILES));
        setName(initialFiles[0]?.name.replace(/\.[^.]+$/, "") ?? "");
        setFolderId(initialFolderId);
        setTagIds([]);
    }, [initialFiles, initialFolderId, open]);

    const addFiles = (incomingFiles: File[]) => {
        const acceptedFiles = incomingFiles.filter((file) => file.size <= MAX_FILE_BYTES);
        setFiles((currentFiles) => [...currentFiles, ...acceptedFiles].slice(0, MAX_FILES));
        if (!name && acceptedFiles[0]) {
            setName(acceptedFiles[0].name.replace(/\.[^.]+$/, ""));
        }
    };

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName || files.length === 0 || saving) return;
        onSave({
            name: trimmedName,
            folderId: folderId || undefined,
            tagIds: tagIds.length ? tagIds : undefined,
            files,
        });
    };

    return (
        <AppModal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={723}
            centered
            flush
            closeIcon={<X size={12} />}
            className="lanhu-asset-upload-modal"
        >
            <section className="lanhu-asset-upload-shell" aria-labelledby="lanhu-asset-upload-title">
                <header className="lanhu-asset-upload-header">
                    <h2 id="lanhu-asset-upload-title">上传资产</h2>
                </header>

                <div className="lanhu-asset-upload-content">
                    <div className="lanhu-asset-upload-left">
                        <div className="lanhu-asset-upload-grid">
                            <button
                                type="button"
                                className="lanhu-asset-upload-add"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="添加上传文件"
                            >
                                <img src={uploadAddIcon} alt="" aria-hidden="true" />
                            </button>
                            <input
                                ref={fileInputRef}
                                hidden
                                type="file"
                                accept={ACCEPTED_FILE_TYPES}
                                multiple
                                onChange={(event) => {
                                    addFiles(Array.from(event.currentTarget.files ?? []));
                                    event.currentTarget.value = "";
                                }}
                            />
                            {files.map((file, index) => (
                                <PreviewItem
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                    file={file}
                                    onRemove={() => {
                                        setFiles((currentFiles) =>
                                            currentFiles.filter((_, currentIndex) => currentIndex !== index),
                                        );
                                    }}
                                />
                            ))}
                        </div>

                        <div className="lanhu-asset-upload-help">
                            <span>支持的文件格式</span>
                            <span><img src={uploadImageTypeIcon} alt="" aria-hidden="true" />jpg/jpeg/png</span>
                            <span><img src={uploadVideoTypeIcon} alt="" aria-hidden="true" />mp4</span>
                            <span><img src={uploadAudioTypeIcon} alt="" aria-hidden="true" />mp3</span>
                            <small>单个文件大小不超过20MB</small>
                        </div>
                    </div>

                    <AssetMetadataFields
                        className="lanhu-asset-upload-fields"
                        name={name}
                        nameLabel="文件名称"
                        namePlaceholder="请输入文件名称"
                        folderId={folderId}
                        tags={tagIds}
                        folders={folders}
                        tagOptions={tags}
                        onNameChange={setName}
                        onFolderChange={setFolderId}
                        onTagsChange={setTagIds}
                    />
                </div>

                <footer className="lanhu-asset-upload-footer">
                    <button type="button" className="lanhu-asset-upload-cancel" onClick={onCancel}>取消</button>
                    <button
                        type="button"
                        className="lanhu-asset-upload-save"
                        disabled={!name.trim() || files.length === 0 || saving}
                        onClick={handleSave}
                    >
                        {saving ? "保存中" : "保存"}
                    </button>
                </footer>
            </section>
        </AppModal>
    );
}

