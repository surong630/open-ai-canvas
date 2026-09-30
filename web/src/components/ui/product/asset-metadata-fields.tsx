import type { ReactNode } from "react";
import { Select as AntSelect } from "antd";

import selectArrowIcon from "@/assets/product-assets/select-arrow.svg";
import { cn } from "@/lib/utils";

import "./asset-metadata-fields.css";

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
                <AntSelect<string>
                    aria-label="所属文件夹"
                    size="small"
                    value={folderId}
                    options={folderOptions}
                    popupMatchSelectWidth={false}
                    virtual={false}
                    placeholder="请选择所属文件夹"
                    notFoundContent={null}
                    suffixIcon={selectArrow}
                    className="asset-metadata-fields__select"
                    classNames={{ popup: { root: "asset-metadata-fields__popup" } }}
                    onChange={(value) => onFolderChange(typeof value === "string" ? value : "")}
                />
            </div>
            <div className="asset-metadata-fields__field">
                <span>设置标签</span>
                <AntSelect<string[]>
                    aria-label="设置标签"
                    size="small"
                    mode="tags"
                    value={tags}
                    options={tagOptions}
                    popupMatchSelectWidth={false}
                    virtual={false}
                    tokenSeparators={[",", "，"]}
                    placeholder="请选择标签"
                    notFoundContent={createTagHint}
                    suffixIcon={selectArrow}
                    className="asset-metadata-fields__select"
                    classNames={{ popup: { root: "asset-metadata-fields__popup" } }}
                    onChange={onTagsChange}
                />
            </div>
        </div>
    );
}
