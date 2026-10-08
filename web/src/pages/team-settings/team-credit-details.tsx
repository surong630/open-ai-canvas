import { App } from "antd";
import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import balanceIcon from "@/assets/credits/core-icon-number@2x.png";
import type { CreditLedgerEntry, WalletSummary } from "@/services/api/wallet";

import { CreditDetailsPanel, type CreditDetailsQuery, type CreditDetailsMember } from "../credits/credit-details-panel";
import "../credits/credits-page.css";
import { DissolveTeamModal } from "./dissolve-team-modal";
import "./team-credit-details.css";

const demoMembers: CreditDetailsMember[] = [
    { id: "member-1", label: "李四" },
    { id: "member-2", label: "用户4804kb" },
];

const demoEntries: CreditLedgerEntry[] = [
    demoEntry("1", "2026-09-12T12:00:00+08:00", "seedance 2.0", "项目名称", "成员备注名", "member-1"),
    demoEntry("2", "2026-09-12T12:00:00+08:00", "seedance 2.5", "AIGC项目", "成员用户名", "member-2"),
    demoEntry("3", "2026-09-12T12:00:00+08:00", "seedream 2.5", "漫剧", "李四", "member-1"),
    demoEntry("4", "2026-09-12T12:00:00+08:00", "seedream 2.5", "AI短剧", "用户4804kb", "member-2"),
];

export default function TeamCreditDetailsPage() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const { teamId = "team" } = useParams();
    const [dissolveModalOpen, setDissolveModalOpen] = useState(false);

    const confirmDissolveTeam = () => {
        setDissolveModalOpen(false);
        message.info("解散团队功能尚未接入");
    };

    return (
        <main className="credits-page team-credits-page">
            <aside className="team-credits-page__sidebar" aria-label="团队设置">
                <button type="button" onClick={() => navigate(-1)}>成员管理</button>
                <button type="button" aria-current="page">积分管理</button>
            </aside>

            <section className="credits-page__workspace">
                <header className="team-credits-page__header">
                    <button type="button" className="team-credits-page__dissolve" onClick={() => setDissolveModalOpen(true)}>解散团队</button>
                    <button type="button" aria-label="关闭团队积分管理" onClick={() => navigate("/home")}><X aria-hidden="true" /></button>
                </header>
                <div className="credits-page__content team-credits-page__content">
                    <h1>积分明细</h1>
                    <CreditDetailsPanel
                        balanceLabel="当前团队剩余积分"
                        balanceIcon={balanceIcon}
                        queryKey={["team-credit-details", teamId]}
                        loadWallet={loadDemoTeamWallet}
                        members={demoMembers}
                        emptyText="当前筛选范围内没有团队积分记录"
                    />
                </div>
            </section>
            <DissolveTeamModal
                open={dissolveModalOpen}
                onCancel={() => setDissolveModalOpen(false)}
                onConfirm={confirmDissolveTeam}
            />
        </main>
    );
}

async function loadDemoTeamWallet(query: CreditDetailsQuery): Promise<WalletSummary> {
    const entries = demoEntries
        .filter((entry) => !query.startTime || Date.parse(entry.createdAt) >= Date.parse(query.startTime))
        .filter((entry) => !query.endTime || Date.parse(entry.createdAt) < Date.parse(query.endTime))
        .filter((entry) => !query.memberId || entry.note === query.memberId)
        .map((entry) => ({ ...entry, type: query.type === "income" ? "admin_grant" as const : query.type }));
    const pageEntries = entries.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    return {
        account: {
            userId: "demo-team",
            availableMicrocredits: 10_000_000_000,
            reservedMicrocredits: 0,
            version: 1,
            createdAt: "2026-09-12T12:00:00+08:00",
            updatedAt: "2026-09-12T12:00:00+08:00",
        },
        entries: pageEntries,
        total: entries.length,
        totalAmountMicrocredits: entries.reduce((sum, entry) => sum + Math.abs(entry.amountMicrocredits), 0),
        page: query.page,
        pageSize: query.pageSize,
        policy: { signupBonusMicrocredits: 0, checkinBonusMicrocredits: 0, checkedInToday: false },
    };
}

function demoEntry(id: string, createdAt: string, model: string, scene: string, memberName: string, memberId: string): CreditLedgerEntry {
    return {
        id,
        userId: "demo-team",
        type: "consume",
        amountMicrocredits: 100_000_000,
        availableDeltaMicrocredits: -100_000_000,
        reservedDeltaMicrocredits: 0,
        availableAfterMicrocredits: 10_000_000_000,
        reservedAfterMicrocredits: 0,
        model,
        scene,
        memberName,
        note: memberId,
        createdAt,
    };
}
