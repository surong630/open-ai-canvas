import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DatePicker, Pagination, Table, type TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router";

import calendarIcon from "@/assets/credits/box-icon-time@2x.png";
import balanceIcon from "@/assets/credits/core-icon-number@2x.png";
import backIcon from "@/assets/credits/icon-core-back@2x.png";
import pageDropIcon from "@/assets/credits/icon-page-drop@2x.png";
import navAssets from "@/assets/credits/nav-assets@2x.png";
import navAssetsSelected from "@/assets/credits/nav-assets-selected@2x.png";
import navHome from "@/assets/credits/nav-home@2x.png";
import navHomeNormal from "@/assets/credits/nav-home-normal@2x.png";
import navProjects from "@/assets/credits/nav-projects@2x.png";
import navProjectsSelected from "@/assets/credits/nav-projects-selected@2x.png";
import pageLeftDisabled from "@/assets/credits/page-left-disabled@2x.png";
import pageRight from "@/assets/credits/page-right@2x.png";
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
    const balance = wallet ? formatCredits(wallet.account.availableMicrocredits, 6) : "--";
    const emptyText = !creditsEnabled ? "积分功能当前未启用" : walletQuery.isError ? (walletQuery.error instanceof Error ? walletQuery.error.message : "积分明细加载失败") : "当前筛选范围内没有积分记录";

    const selectTab = (next: LedgerTab) => {
        setTab(next);
        setPage(1);
    };

    return (
        <main className="credits-page">
            <aside className="credits-page__sidebar">
                <h1>{appearance.brandName || "系统名称"}</h1>
                <nav aria-label="首页导航">
                    <NavLink to="/home" className="active"><NavIcon normal={navHomeNormal} selected={navHome} />首页</NavLink>
                    <NavLink to="/canvas-projects"><NavIcon normal={navProjects} selected={navProjectsSelected} />项目</NavLink>
                    <NavLink to="/assets"><NavIcon normal={navAssets} selected={navAssetsSelected} />资产</NavLink>
                </nav>
            </aside>

            <section className="credits-page__workspace">
                <header className="credits-page__topbar">
                    <span className="credits-page__balance"><img src={balanceIcon} alt="" />{balance}</span>
                    <ProductAccountMenu triggerClassName="credits-page__avatar" />
                </header>

                <div className="credits-page__content">
                    <button type="button" className="credits-page__back" onClick={() => navigate("/home")}><img src={backIcon} alt="" />积分明细</button>
                    <div className="credits-page__account"><img src={balanceIcon} alt="" /><strong>{balance}</strong><span>当前账户总余额</span></div>

                    <div className="credits-page__tabs" role="tablist" aria-label="积分明细类型">
                        {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => selectTab(item.id)}>{item.label}</button>)}
                    </div>

                    <div className="credits-page__filters">
                        <DatePicker.RangePicker
                            className="credits-page__date-range"
                            allowClear
                            format="YYYY-MM-DD"
                            placeholder={["开始时间", "结束时间"]}
                            separator="-"
                            suffixIcon={<img src={calendarIcon} alt="" />}
                            value={startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null}
                            onChange={(dates) => {
                                setStartDate(dates?.[0]?.format("YYYY-MM-DD") || "");
                                setEndDate(dates?.[1]?.format("YYYY-MM-DD") || "");
                                setPage(1);
                            }}
                        />
                        <span className="credits-page__total">累计获取：<strong>{wallet ? formatCredits(Math.abs(wallet.totalAmountMicrocredits), 6) : "--"}</strong>积分</span>
                    </div>

                    <Table<CreditLedgerEntry>
                        className="credits-page__table"
                        columns={ledgerColumns(tab)}
                        dataSource={wallet?.entries || []}
                        loading={walletQuery.isFetching}
                        locale={{ emptyText }}
                        pagination={false}
                        rowKey="id"
                        tableLayout="fixed"
                    />

                    <footer className="credits-page__footer">
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            pageSizeOptions={[20, 50, 100]}
                            total={wallet?.total || 0}
                            disabled={walletQuery.isFetching}
                            showQuickJumper
                            showSizeChanger={{ suffixIcon: <img src={pageDropIcon} alt="" /> }}
                            showTotal={(total) => `共${total}笔`}
                            itemRender={(_, type, originalElement) => type === "prev" ? <img className="credits-page__page-arrow" src={pageLeftDisabled} alt="上一页" /> : type === "next" ? <img className="credits-page__page-arrow" src={pageRight} alt="下一页" /> : originalElement}
                            onChange={(nextPage, nextPageSize) => {
                                setPage(nextPageSize !== pageSize ? 1 : nextPage);
                                setPageSize(nextPageSize);
                            }}
                        />
                    </footer>
                </div>
            </section>
        </main>
    );
}

function NavIcon({ normal, selected }: { normal: string; selected: string }) {
    return <span className="credits-page__nav-icon" aria-hidden="true"><img className="is-normal" src={normal} alt="" /><img className="is-selected" src={selected} alt="" /></span>;
}

function ledgerColumns(tab: LedgerTab): TableColumnsType<CreditLedgerEntry> {
    const pointsColumn = {
        title: tab === "income" ? "积分值" : tab === "consume" ? "消耗积分" : "返还积分",
        key: "points",
        width: tab === "income" ? "7%" : "15%",
        align: "right" as const,
        render: (_: unknown, entry: CreditLedgerEntry) => formatCredits(Math.abs(entry.amountMicrocredits), 6),
    };
    if (tab === "income") return [
        { title: "获取时间", dataIndex: "createdAt", key: "createdAt", width: "45.6%", render: formatDateTime },
        { title: "获取方式", key: "source", width: "47.4%", render: (_: unknown, entry) => incomeLabel(entry) },
        pointsColumn,
    ];
    return [
        { title: tab === "consume" ? "消耗时间" : "返还时间", dataIndex: "createdAt", key: "createdAt", width: "20%", render: formatDateTime },
        { title: "模型", dataIndex: "model", key: "model", width: "25%", render: (value?: string) => value || "—" },
        { title: "所属项目", dataIndex: "scene", key: "scene", width: "25%", render: (value?: string) => value || "—" },
        pointsColumn,
    ];
}

function incomeLabel(entry: CreditLedgerEntry) {
    const labels: Record<CreditLedgerEntry["type"], string> = {
        redeem: "兑换码充值", payment_topup: "在线充值", admin_grant: "系统发放", consume: "模型消费", refund: "消费返还", admin_adjustment: "系统调整", signup_bonus: "注册赠送", checkin_bonus: "签到奖励",
    };
    return labels[entry.type] || entry.note || "积分获取";
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
