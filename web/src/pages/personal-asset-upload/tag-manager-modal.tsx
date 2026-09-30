import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";
import { Search, X } from "lucide-react";

import pageDropIcon from "@/assets/credits/icon-page-drop@2x.png";
import pageLeftDisabled from "@/assets/credits/page-left-disabled@2x.png";
import pageRight from "@/assets/credits/page-right@2x.png";
import { AppModal } from "@/components/ui/product/app-modal";
import { DeleteTagConfirmModal } from "./delete-tag-confirm-modal";

import "./tag-manager-modal.css";

export type PersonalAssetTag = {
    name: string;
    count: number;
};

export type LanhuTagManagerModalProps = {
    open: boolean;
    tags: PersonalAssetTag[];
    onCancel: () => void;
    onCreate?: (name: string) => void;
    onRename?: (oldName: string, newName: string) => void;
    onDelete?: (name: string) => void;
};

export function LanhuTagManagerModal({
    open,
    tags,
    onCancel,
    onCreate,
    onRename,
    onDelete,
}: LanhuTagManagerModalProps) {
    const [newTagName, setNewTagName] = useState("");
    const [keyword, setKeyword] = useState("");
    const [editingName, setEditingName] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [jumpPage, setJumpPage] = useState("1");
    const [deletingTagName, setDeletingTagName] = useState<string | null>(null);

    const visibleTags = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase();
        if (!normalizedKeyword) return tags;
        return tags.filter((tag) => tag.name.toLocaleLowerCase().includes(normalizedKeyword));
    }, [keyword, tags]);
    const totalPages = Math.max(1, Math.ceil(visibleTags.length / pageSize));
    const pageTags = visibleTags.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setJumpPage(String(page));
    }, [page]);

    useEffect(() => {
        setPage(1);
    }, [keyword]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    const createTag = () => {
        const name = newTagName.trim();
        if (!name) return;
        onCreate?.(name);
        setNewTagName("");
    };

    const saveRename = () => {
        const name = draftName.trim();
        if (!editingName || !name) return;
        onRename?.(editingName, name);
        setEditingName(null);
        setDraftName("");
    };

    const jumpToPage = () => {
        const requestedPage = Number.parseInt(jumpPage, 10);
        if (!Number.isFinite(requestedPage)) {
            setJumpPage(String(page));
            return;
        }
        const nextPage = Math.min(totalPages, Math.max(1, requestedPage));
        setJumpPage(String(nextPage));
        setPage(nextPage);
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
            className="lanhu-tag-manager-modal"
        >
            <section className="lanhu-tag-manager-shell" aria-labelledby="lanhu-tag-manager-title">
                <header className="lanhu-tag-manager-header">
                    <h2 id="lanhu-tag-manager-title">标签管理</h2>
                </header>

                <div className="lanhu-tag-manager-body">
                    <div className="lanhu-tag-manager-create">
                        <input
                            value={newTagName}
                            placeholder="请输入标签名称后，点击加号进行添加"
                            onChange={(event) => setNewTagName(event.currentTarget.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") createTag();
                            }}
                        />
                        <button type="button" aria-label="添加标签" onClick={createTag}>＋</button>
                    </div>

                    <label className="lanhu-tag-manager-search">
                        <Search aria-hidden="true" />
                        <input value={keyword} placeholder="请输入名称进行搜索" onChange={(event) => setKeyword(event.currentTarget.value)} />
                    </label>

                    <div className="lanhu-tag-manager-table">
                        <div className="lanhu-tag-manager-table-head" role="row">
                            <strong>标签名称</strong>
                            <strong>关联文件数</strong>
                            <strong>操作</strong>
                        </div>
                        <div className="lanhu-tag-manager-rows">
                            {pageTags.map((tag) => {
                                const editing = editingName === tag.name;
                                return (
                                    <div className="lanhu-tag-manager-row" role="row" key={tag.name}>
                                        <div>
                                            {editing ? (
                                                <input autoFocus value={draftName} onChange={(event) => setDraftName(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); }} />
                                            ) : tag.name}
                                        </div>
                                        <span>{tag.count}个</span>
                                        <div className="lanhu-tag-manager-actions">
                                            {editing ? (
                                                <>
                                                    <button type="button" onClick={saveRename}>保存</button>
                                                    <button type="button" onClick={() => setEditingName(null)}>取消</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={() => { setEditingName(tag.name); setDraftName(tag.name); }}>重命名</button>
                                                    <button type="button" className="is-danger" onClick={() => setDeletingTagName(tag.name)}>删除</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="lanhu-tag-manager-pagination">
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        pageSizeOptions={[20, 50, 100]}
                        total={visibleTags.length}
                        showSizeChanger={{
                            className: "lanhu-tag-manager-size-select",
                            suffixIcon: <img src={pageDropIcon} alt="" />,
                            classNames: { popup: { root: "lanhu-tag-manager-size-menu" } },
                        }}
                        showTotal={(total) => `共${total}笔`}
                        itemRender={(_, type, originalElement) => type === "prev" ? <img className="lanhu-tag-manager-page-arrow" src={pageLeftDisabled} alt="上一页" /> : type === "next" ? <img className="lanhu-tag-manager-page-arrow" src={pageRight} alt="下一页" /> : originalElement}
                        onChange={(nextPage, nextPageSize) => {
                            setPage(nextPageSize !== pageSize ? 1 : nextPage);
                            setPageSize(nextPageSize);
                        }}
                    />
                    <label className="lanhu-tag-manager-quick-jumper">
                        <span>跳至</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            aria-label="跳转页码"
                            value={jumpPage}
                            onChange={(event) => setJumpPage(event.target.value.replace(/\D/g, ""))}
                            onBlur={jumpToPage}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    jumpToPage();
                                }
                            }}
                        />
                        <span>页</span>
                    </label>
                </footer>
                <DeleteTagConfirmModal
                    open={Boolean(deletingTagName)}
                    onCancel={() => setDeletingTagName(null)}
                    onConfirm={() => {
                        if (deletingTagName) onDelete?.(deletingTagName);
                        setDeletingTagName(null);
                    }}
                />
            </section>
        </AppModal>
    );
}
