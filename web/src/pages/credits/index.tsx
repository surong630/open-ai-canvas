import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Coins, LoaderCircle, RefreshCw, UserRound, UsersRound, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router";

import { formatCredits } from "@/constant/credits";
import { ProductAccountMenu } from "@/components/layout/product-account-menu";
import { getWallet, type CreditLedgerEntry } from "@/services/api/wallet";
import { useAppearanceStore } from "@/stores/use-appearance-store";
import { useUserStore } from "@/stores/use-user-store";

import "./credits-page.css";

type LedgerTab = "income" | "consume" | "refund";

const tabs: Array<{ id: LedgerTab; label: string }> = [
    { id: "income", label: "已获取" },
    { id: "consume", label: "已消耗" },
    { id: "refund", label: "已返还" },
];

export default function CreditsPage() {
    const navigate = useNavigate();
    const appearance = useAppearanceStore((state) => state.appearance);
    const user = useUserStore((state) => state.user);
    const creditsEnabled = useUserStore((state) => state.features.creditsEnabled);
    const [tab, setTab] = useState<LedgerTab>("income");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const range = useMemo(() => ({
        ...(startDate ? { startTime: dateBoundary(startDate) } : {}),
        ...(endDate ? { endTime: dateBoundary(endDate, true) } : {}),
    }), [endDate, startDate]);
    const walletQuery = useQuery({
        queryKey: ["credit-details", user?.id, tab, page, pageSize, range.startTime, range.endTime],
        queryFn: () => getWallet(page, pageSize, tab, range),
        enabled: Boolean(user?.id && creditsEnabled),
        placeholderData: keepPreviousData,
        staleTime: 15_000,
    });
    const wallet = walletQuery.data;
    const totalPages = Math.max(1, Math.ceil((wallet?.total || 0) / pageSize));
    const balance = wallet ? formatCredits(wallet.account.availableMicrocredits, 6) : "--";

    const selectTab = (next: LedgerTab) => {
        setTab(next);
        setPage(1);
    };

    return (
        <main className="credits-page">
            <aside className="credits-page__sidebar">
                <h1>{appearance.brandName || "系统名称"}</h1>
                <nav aria-label="账户管理">
                    <NavLink to="/settings"><UsersRound />成员管理</NavLink>
                    <NavLink to="/credits" className="active"><Coins />积分管理</NavLink>
                </nav>
            </aside>

            <section className="credits-page__workspace">
                <header className="credits-page__topbar">
                    <span className="credits-page__balance"><Zap />{balance}</span>
                    <ProductAccountMenu triggerClassName="credits-page__avatar" />
                </header>

                <div className="credits-page__content">
                    <button type="button" className="credits-page__back" onClick={() => navigate("/home")}><ChevronLeft />积分明细</button>
                    <div className="credits-page__account"><Zap /><strong>{balance}</strong><span>当前账户总余额</span></div>

                    <div className="credits-page__tabs" role="tablist" aria-label="积分明细类型">
                        {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => selectTab(item.id)}>{item.label}</button>)}
                    </div>

                    <div className="credits-page__filters">
                        <label><span>{tabLabel(tab)}时间：</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} /></label>
                        <i>–</i>
                        <label className="is-end"><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} /></label>
                        <button type="button" className="credits-page__refresh" onClick={() => void walletQuery.refetch()} disabled={walletQuery.isFetching}><RefreshCw className={walletQuery.isFetching ? "is-spinning" : undefined} />刷新</button>
                        <span className="credits-page__total">累计{tabLabel(tab)}：<strong>{wallet ? formatCredits(Math.abs(wallet.totalAmountMicrocredits), 6) : "--"}</strong>积分</span>
                    </div>

                    <div className="credits-page__table-wrap">
                        <table>
                            <thead><LedgerHeader tab={tab} /></thead>
                            <tbody>
                                {!creditsEnabled ? <StateRow tab={tab} text="积分功能当前未启用" /> : walletQuery.isLoading ? <StateRow tab={tab} loading text="正在加载积分明细" /> : walletQuery.isError ? <StateRow tab={tab} text={walletQuery.error instanceof Error ? walletQuery.error.message : "积分明细加载失败"} /> : wallet?.entries.length ? wallet.entries.map((entry) => <LedgerRow key={entry.id} tab={tab} entry={entry} />) : <StateRow tab={tab} text="当前筛选范围内没有积分记录" />}
                            </tbody>
                        </table>
                    </div>

                    <footer className="credits-page__footer">
                        <span>共{wallet?.total || 0}笔{tab === "consume" ? <>　合计消耗 <strong>{wallet ? formatCredits(Math.abs(wallet.totalAmountMicrocredits), 6) : "--"}</strong> 积分</> : null}</span>
                        <div className="credits-page__pagination">
                            <button type="button" aria-label="上一页" disabled={page <= 1 || walletQuery.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></button>
                            <strong>{page}</strong>
                            <button type="button" aria-label="下一页" disabled={page >= totalPages || walletQuery.isFetching} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight /></button>
                            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="每页条数">
                                {[20, 50, 100].map((size) => <option key={size} value={size}>{size}条/页</option>)}
                            </select>
                            <span>跳至</span><input type="number" min={1} max={totalPages} value={page} onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} aria-label="跳转页码" /><span>页</span>
                        </div>
                    </footer>
                </div>
            </section>
        </main>
    );
}

function LedgerHeader({ tab }: { tab: LedgerTab }) {
    if (tab === "income") return <tr><th>获取时间</th><th>获取方式</th><th className="is-number">积分值</th></tr>;
    return <tr><th>{tab === "consume" ? "消耗时间" : "返还时间"}</th><th>模型</th><th>所属项目</th><th className="is-number">{tab === "consume" ? "消耗积分" : "返还积分"}</th></tr>;
}

function LedgerRow({ tab, entry }: { tab: LedgerTab; entry: CreditLedgerEntry }) {
    if (tab === "income") return <tr><td>{formatDateTime(entry.createdAt)}</td><td>{incomeLabel(entry)}</td><td className="is-number">{formatCredits(Math.abs(entry.amountMicrocredits), 6)}</td></tr>;
    return <tr><td>{formatDateTime(entry.createdAt)}</td><td>{entry.model || "—"}</td><td>{entry.scene || "—"}</td><td className="is-number">{formatCredits(Math.abs(entry.amountMicrocredits), 6)}</td></tr>;
}

function StateRow({ tab, text, loading = false }: { tab: LedgerTab; text: string; loading?: boolean }) {
    return <tr><td colSpan={tab === "income" ? 3 : 4} className="credits-page__state">{loading ? <LoaderCircle className="is-spinning" /> : <UserRound />}{text}</td></tr>;
}

function incomeLabel(entry: CreditLedgerEntry) {
    const labels: Record<CreditLedgerEntry["type"], string> = {
        redeem: "兑换码充值", payment_topup: "在线充值", admin_grant: "系统发放", consume: "模型消费", refund: "消费返还", admin_adjustment: "系统调整", signup_bonus: "注册赠送", checkin_bonus: "签到奖励",
    };
    return labels[entry.type] || entry.note || "积分获取";
}

function tabLabel(tab: LedgerTab) {
    return tab === "income" ? "获取" : tab === "consume" ? "消耗" : "返还";
}

function formatDateTime(value: string) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "—";
    return new Date(timestamp).toLocaleString("zh-CN", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function dateBoundary(value: string, nextDay = false) {
    const date = new Date(`${value}T00:00:00`);
    if (nextDay) date.setDate(date.getDate() + 1);
    return date.toISOString();
}
