import closeIcon from "@/assets/team/modal-close.svg";
import { AppModal } from "@/components/ui/product/app-modal";
import { XingpeiInput } from "@/components/ui/product/xingpei-input";
import { useEffect, useState } from "react";

import "./member-credit-config-modal.css";

type ConfigMember = { id: string; name: string; username?: string; email: string; usage: string };

export function MemberCreditConfigModal({ open, members, onCancel, onConfirm }: { open: boolean; members: ConfigMember[]; onCancel: () => void; onConfirm: (limits: Record<string, string>) => void }) {
    const [limits, setLimits] = useState<Record<string, string>>({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [affectedNames, setAffectedNames] = useState<string[]>([]);
    useEffect(() => {
        if (!open) return;
        setLimits(Object.fromEntries(members.map((member) => [member.id, member.usage.split("/")[1] ?? ""])));
    }, [members, open]);
    useEffect(() => {
        if (!open) setConfirmOpen(false);
    }, [open]);
    return (
        <>
        <AppModal open={open && !confirmOpen} title={null} footer={null} width={604} centered flush closeIcon={<img src={closeIcon} alt="" />} rootClassName="member-credit-config-modal" onCancel={onCancel}>
            <form className="member-credit-config-modal__shell" onSubmit={(event) => {
                event.preventDefault();
                const affected = members.filter((member) => Number(limits[member.id]) < Number(member.usage.split("/")[0])).map((member) => member.name);
                if (!affected.length) { onConfirm(limits); return; }
                setAffectedNames(affected);
                setConfirmOpen(true);
            }}>
                <header className="member-credit-config-modal__header"><h2>成员积分配置</h2></header>
                <div className="member-credit-config-modal__body">
                    <p className="member-credit-config-modal__description">为每位成员设置本月积分上限，积分将在次月1号进行重置。</p>
                    <div className="member-credit-config-modal__summary">团队剩余积分：<strong>76414</strong></div>
                    <div className="member-credit-config-modal__list">
                        {members.map((member) => (
                            <div className="member-credit-config-modal__row" key={member.id}>
                                <div className="member-credit-config-modal__member"><span className="member-credit-config-modal__avatar" aria-hidden="true" /><span><strong>{member.name}</strong><small>{member.username ?? member.email}</small></span></div>
                                <span className="member-credit-config-modal__usage"><small>本月已用</small><strong>{member.usage.split("/")[0]}</strong><small>积分</small></span>
                                <XingpeiInput rootClassName="member-credit-config-input" value={limits[member.id] ?? ""} suffix="积分" inputMode="numeric" onChange={(event) => setLimits((current) => ({ ...current, [member.id]: event.target.value.replace(/\D/g, "") }))} />
                            </div>
                        ))}
                    </div>
                    <p className="member-credit-config-modal__warning">成员月度额度总和：80000，团队可用积分：76414</p>
                </div>
                <footer className="member-credit-config-modal__footer"><button type="button" className="member-credit-config-modal__cancel" onClick={onCancel}>取消</button><button type="submit" className="member-credit-config-modal__confirm">保存</button></footer>
            </form>
        </AppModal>
        <AppModal open={confirmOpen} title={null} footer={null} width={420} centered flush closeIcon={<img src={closeIcon} alt="" />} rootClassName="member-credit-config-confirm-modal" onCancel={() => setConfirmOpen(false)}>
            <div className="member-credit-config-confirm-modal__shell">
                <header><h2>提示</h2></header>
                <p>本次设置的积分额度低于成员本月已消耗积分。保存后，对应成员本月将无法继续使用团队积分，历史消耗不会回退。是否确认保存？</p>
                <strong className="member-credit-config-confirm-modal__members">涉及成员：{affectedNames.join("、")}</strong>
                <footer><button type="button" onClick={() => setConfirmOpen(false)}>否</button><button type="button" onClick={() => { setConfirmOpen(false); onConfirm(limits); }}>是</button></footer>
            </div>
        </AppModal>
        </>
    );
}
