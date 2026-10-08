import { App } from "antd";
import { UsersRound, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import tipIcon from "@/assets/team/icon-tip-orange@2x.png";
import { AppModal } from "@/components/ui/product/app-modal";
import { XingpeiInput } from "@/components/ui/product/xingpei-input";

import "./create-team-modal.css";

const MAX_TEAM_NAME_LENGTH = 10;

export type CreateTeamDraft = {
    name: string;
    avatarUrl?: string;
};

type CreateTeamModalProps = {
    open: boolean;
    onCancel: () => void;
    onConfirm: (draft: CreateTeamDraft) => void;
};

export function CreateTeamModal({ open, onCancel, onConfirm }: CreateTeamModalProps) {
    const { message } = App.useApp();
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setName("");
            setAvatarUrl(undefined);
        }
    }, [open]);

    const submit = () => {
        const normalizedName = name.trim();
        if (!normalizedName) {
            message.warning("请输入团队名称");
            return;
        }
        onConfirm({ name: normalizedName, avatarUrl });
    };

    const selectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            message.warning("请选择图片文件");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            message.warning("团队头像不能超过 2MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : undefined);
        reader.onerror = () => message.error("头像读取失败，请重新选择");
        reader.readAsDataURL(file);
    };

    return (
        <AppModal
            flush
            centered
            open={open}
            width={723}
            title={null}
            footer={null}
            closable={false}
            onCancel={onCancel}
            rootClassName="create-team-modal"
        >
            <form className="create-team-modal__shell" onSubmit={(event) => { event.preventDefault(); submit(); }}>
                <header className="create-team-modal__header">
                    <h2>创建团队</h2>
                    <button type="button" aria-label="关闭" onClick={onCancel}><X aria-hidden="true" /></button>
                </header>

                <div className="create-team-modal__body">
                    <div className="create-team-modal__notice">
                        <img src={tipIcon} alt="" aria-hidden="true" />
                        <span>新团队拥有独立的计费账户，初始积分为0。</span>
                    </div>
                    <label className="create-team-modal__field">
                        <span><i aria-hidden="true">*</i>团队名称</span>
                        <XingpeiInput
                            autoFocus
                            value={name}
                            maxLength={MAX_TEAM_NAME_LENGTH}
                            placeholder="请输入团队名称"
                            showCount={{ formatter: ({ count, maxLength }) => `${count}/${maxLength}` }}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </label>

                    <div className="create-team-modal__avatar-field">
                        <span>团队头像</span>
                        <div className="create-team-modal__avatar-row">
                            <span className="create-team-modal__avatar" aria-hidden="true">
                                {avatarUrl ? <img src={avatarUrl} alt="" /> : <UsersRound />}
                            </span>
                            <button type="button" onClick={() => fileInputRef.current?.click()}>
                                更换头像
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={selectAvatar} />
                        </div>
                    </div>
                </div>

                <footer className="create-team-modal__footer">
                    <button type="button" className="create-team-modal__cancel" onClick={onCancel}>取消</button>
                    <button type="submit" className="create-team-modal__confirm">确定</button>
                </footer>
            </form>
        </AppModal>
    );
}
