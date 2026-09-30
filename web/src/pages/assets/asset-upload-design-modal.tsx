import { useMemo, useRef, useState } from "react";
import { Modal, Select } from "antd";
import { AudioLines, Check, Image as ImageIcon, Play, Plus, X } from "lucide-react";
import "./asset-upload-design-modal.css";

type UploadAssetDraft = {
    name: string;
    folderId?: string;
    tags: string[];
    files: File[];
};

type AssetUploadDesignModalProps = {
    open: boolean;
    folders?: Array<{ label: string; value: string }>;
    tags?: Array<{ label: string; value: string }>;
    initialFiles?: File[];
    onClose: () => void;
    onSave: (draft: UploadAssetDraft) => void;
};

function fileKind(file: File) {
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("video/")) return "video";
    return "image";
}

function Preview({ file }: { file: File }) {
    const kind = fileKind(file);
    const [src] = useState(() => (kind === "image" ? URL.createObjectURL(file) : ""));
    if (kind === "image") return <img src={src} alt="" className="asset-upload-design-preview-media" />;
    if (kind === "video") return <div className="asset-upload-design-preview-icon"><Play size={34} fill="currentColor" /></div>;
    return <div className="asset-upload-design-preview-icon"><AudioLines size={42} /></div>;
}

export function AssetUploadDesignModal({ open, folders = [], tags = [], initialFiles = [], onClose, onSave }: AssetUploadDesignModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [name, setName] = useState(initialFiles[0]?.name.replace(/\.[^.]+$/, "") || "");
    const [folderId, setFolderId] = useState<string>();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const allFiles = useMemo(() => files.slice(0, 20), [files]);
    const addFiles = (next: File[]) => {
        setFiles((current) => [...current, ...next].slice(0, 20));
        if (!name && next[0]) setName(next[0].name.replace(/\.[^.]+$/, ""));
    };
    const close = () => {
        setFiles(initialFiles);
        onClose();
    };
    return (
        <Modal open={open} onCancel={close} footer={null} width={1000} centered destroyOnHidden className="asset-upload-design-modal" closeIcon={<X size={23} />}>
            <div className="asset-upload-design-shell">
                <header className="asset-upload-design-header"><h2>上传资产</h2></header>
                <div className="asset-upload-design-body">
                    <section className="asset-upload-design-gallery">
                        <button type="button" className="asset-upload-design-add" onClick={() => inputRef.current?.click()} aria-label="添加资产"><Plus size={36} /></button>
                        <input ref={inputRef} hidden type="file" accept="image/*,video/mp4,audio/mpeg" multiple onChange={(event) => { addFiles(Array.from(event.target.files || [])); event.currentTarget.value = ""; }} />
                        {allFiles.map((file, index) => (
                            <article key={`${file.name}-${file.lastModified}-${index}`} className="asset-upload-design-card">
                                <div className="asset-upload-design-thumb"><Preview file={file} /><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`移除 ${file.name}`}><X size={15} /></button></div>
                                <span title={file.name}>{file.name}</span>
                            </article>
                        ))}
                    </section>
                    <aside className="asset-upload-design-fields">
                        <label><span><i>*</i>文件名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入文件名称" /></label>
                        <label><span>所属文件夹</span><Select allowClear value={folderId} options={folders} placeholder="请选择所属文件夹" onChange={setFolderId} /></label>
                        <label><span>设置标签</span><Select mode="multiple" value={selectedTags} options={tags} placeholder="请选择标签" onChange={setSelectedTags} /></label>
                    </aside>
                </div>
                <footer className="asset-upload-design-footer">
                    <div className="asset-upload-design-hints"><span>支持的文件格式</span><span><ImageIcon size={16} /> jpg/jpeg/png</span><span><Play size={15} fill="currentColor" /> mp4</span><span><AudioLines size={16} /> mp3</span><small>单个文件大小不超过20MB</small></div>
                    <div className="asset-upload-design-actions"><button type="button" className="asset-upload-design-cancel" onClick={close}>取消</button><button type="button" className="asset-upload-design-save" disabled={!name.trim() || !allFiles.length} onClick={() => onSave({ name: name.trim(), folderId, tags: selectedTags, files: allFiles })}><Check size={17} />保存</button></div>
                </footer>
            </div>
        </Modal>
    );
}

export type { AssetUploadDesignModalProps, UploadAssetDraft };
