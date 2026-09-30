import { useMemo, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";

import selectArrowIcon from "@/assets/product-assets/select-arrow.svg";
import { cn } from "@/lib/utils";

import "./asset-metadata-fields.css";
import { ProductBlackSelect } from "./product-black-select";

export type AssetMetadataOption = {
    label: ReactNode;
    value: string;
    disabled?: boolean;
};

export type AssetMetadataFieldsProps = {
    className?: string;
    name?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    nameAutoFocus?: boolean;
    nameMaxLength?: number;
    showName?: boolean;
    folderId: string;
    tags: string[];
    folders: AssetMetadataOption[];
    tagOptions: AssetMetadataOption[];
    onNameChange?: (value: string) => void;
    onFolderChange: (value: string) => void;
    onTagsChange: (value: string[]) => void;
};

const emptyFolderOptions: AssetMetadataOption[] = [{
    value: "__empty_folder__",
    label: <span className="asset-metadata-fields__empty-option">暂无文件夹</span>,
    disabled: true,
}];
const createTagHint = <span className="asset-metadata-fields__empty-option">输入标签后按回车创建</span>;
const selectArrow = <img src={selectArrowIcon} alt="" />;

export function AssetMetadataFields({
    className,
    name = "",
    nameLabel = "资产名称",
    namePlaceholder = "请输入资产名称",
    nameAutoFocus = false,
    nameMaxLength = 80,
    showName = true,
    folderId,
    tags,
    folders,
    tagOptions,
    onNameChange,
    onFolderChange,
    onTagsChange,
}: AssetMetadataFieldsProps) {
    const folderOptions = folders.length ? folders : emptyFolderOptions;
    const [tagPopupOpen, setTagPopupOpen] = useState(false);
    const [creatingTag, setCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [createdTags, setCreatedTags] = useState<string[]>([]);
    const mergedTagOptions = useMemo(() => {
        const values = new Set(tagOptions.map((option) => option.value));
        const options = [...tagOptions];
        [...createdTags, ...tags].forEach((tag) => {
            if (values.has(tag)) return;
            values.add(tag);
            options.push({ label: tag, value: tag });
        });
        return options;
    }, [createdTags, tagOptions, tags]);

    const cancelTagCreation = () => {
        setCreatingTag(false);
        setNewTagName("");
    };

    const createTag = () => {
        const name = newTagName.trim();
        if (!name) return;
        const existing = mergedTagOptions.find((option) => option.value.toLocaleLowerCase() === name.toLocaleLowerCase());
        const value = existing?.value ?? name;
        if (!existing) setCreatedTags((current) => [...current, name]);
        if (!tags.includes(value)) onTagsChange([...tags, value]);
        cancelTagCreation();
    };

    return (
        <div className={cn("asset-metadata-fields", className)}>
            {showName ? (
                <label className="asset-metadata-fields__field is-required">
                    <span>*<span>{nameLabel}</span></span>
                    <input
                        value={name}
                        maxLength={nameMaxLength}
                        autoFocus={nameAutoFocus}
                        placeholder={namePlaceholder}
                        onChange={(event) => onNameChange?.(event.currentTarget.value)}
                    />
                </label>
            ) : null}
            <div className="asset-metadata-fields__field">
                <span>所属文件夹</span>
                <ProductBlackSelect<string>
                    aria-label="所属文件夹"
                    size="small"
                    value={folderId}
                    options={folderOptions}
                    popupMatchSelectWidth={false}
                    virtual={false}
                    placeholder="请选择所属文件夹"
                    notFoundContent={null}
                    suffixIcon={selectArrow}
                    className="asset-save-dialog__select bg-[#373737]! mt-2! mb-2! w-full!"
                    popupClassName="asset-save-dialog__popup"
                    onChange={(value) => onFolderChange(typeof value === "string" ? value : "")}
                />
            </div>
            <div className="asset-metadata-fields__field">
                <span>设置标签</span>
                <ProductBlackSelect<string[]>
                    aria-label="设置标签"
                    size="small"
                    mode="tags"
                    open={tagPopupOpen}
                    value={tags}
                    options={mergedTagOptions}
                    popupMatchSelectWidth={false}
                    virtual={false}
                    tokenSeparators={[",", "，"]}
                    placeholder="请选择标签"
                    notFoundContent={createTagHint}
                    suffixIcon={selectArrow}
                    className="asset-save-dialog__select mt-2! w-full! bg-[#373737]!"
                    popupClassName="asset-save-dialog__popup asset-metadata-fields__tag-popup"
                    popupRender={() => (
                        <div className="asset-metadata-fields__tag-menu" onMouseDown={(event) => event.stopPropagation()}>
                            <div className="asset-metadata-fields__tag-menu-header">
                                <span>标签</span>
                                <button
                                    type="button"
                                    aria-label="添加标签"
                                    aria-pressed={creatingTag}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                    }}
                                    onClick={() => {
                                        setTagPopupOpen(true);
                                        if (creatingTag) cancelTagCreation();
                                        else setCreatingTag(true);
                                    }}
                                >
                                    <Plus aria-hidden="true" />
                                </button>
                            </div>
                            {creatingTag ? (
                                <div className="asset-metadata-fields__tag-create">
                                    <input
                                        autoFocus
                                        value={newTagName}
                                        aria-label="新标签名称"
                                        maxLength={40}
                                        onChange={(event) => setNewTagName(event.currentTarget.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                createTag();
                                            } else if (event.key === "Escape") {
                                                event.stopPropagation();
                                                cancelTagCreation();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="is-confirm"
                                        aria-label="确认添加标签"
                                        disabled={!newTagName.trim()}
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                        }}
                                        onClick={createTag}
                                    >
                                        <Check aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="取消添加标签"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                        }}
                                        onClick={cancelTagCreation}
                                    >
                                        <X aria-hidden="true" />
                                    </button>
                                </div>
                            ) : null}
                            <div className="asset-metadata-fields__tag-options" role="listbox" aria-label="标签列表" aria-multiselectable="true">
                                {mergedTagOptions.map((option) => {
                                    const selected = tags.includes(option.value);
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            disabled={option.disabled}
                                            className="asset-metadata-fields__tag-option"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                            }}
                                            onClick={() => {
                                                setTagPopupOpen(true);
                                                onTagsChange(selected ? tags.filter((tag) => tag !== option.value) : [...tags, option.value]);
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {selected ? <Check aria-hidden="true" /> : null}
                                        </button>
                                    );
                                })}
                                {mergedTagOptions.length === 0 ? <span className="asset-metadata-fields__tag-empty">暂无标签，请点击加号添加</span> : null}
                            </div>
                        </div>
                    )}
                    onOpenChange={(open) => {
                        setTagPopupOpen(open);
                        if (!open) cancelTagCreation();
                    }}
                    onChange={onTagsChange}
                />
            </div>
        </div>
    );
}
