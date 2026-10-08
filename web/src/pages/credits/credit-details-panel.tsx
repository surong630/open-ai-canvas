import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pagination, Table, type TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import calendarIcon from "@/assets/credits/box-icon-time@2x.png";
import pageDropIcon from "@/assets/credits/icon-page-drop@2x.png";
import pageLeftDisabled from "@/assets/credits/page-left-disabled@2x.png";
import pageRight from "@/assets/credits/page-right@2x.png";
import { formatCredits } from "@/constant/credits";
import { XingpeiSelect } from "@/components/ui/product/xingpei-select";
import { XingpeiRangePicker } from "@/components/ui/product/xingpei-range-picker";
import type { CreditLedgerEntry, WalletSummary } from "@/services/api/wallet";

export type LedgerTab = "income" | "consume" | "refund";

export type CreditDetailsQuery = {
    page: number;
    pageSize: number;
    type: LedgerTab;
    startTime?: string;
    endTime?: string;
    memberId?: string;
};

export type CreditDetailsMember = {
    id: string;
    label: string;
};

type CreditDetailsPanelProps = {
    balanceLabel: string;
    balanceIcon?: string;
    balance?: string;
    enabled?: boolean;
    queryKey: readonly unknown[];
    loadWallet: (query: CreditDetailsQuery) => Promise<WalletSummary>;
    members?: CreditDetailsMember[];
    emptyText?: string;
};

const tabs: Array<{ id: LedgerTab; label: string }> = [
    { id: "income", label: "已获取" },
    { id: "consume", label: "已消耗" },
    { id: "refund", label: "已返还" },
];

const totalLabels: Record<LedgerTab, string> = {
    income: "累计获取",
    consume: "累计消耗",
    refund: "累计返还",
};

export function CreditDetailsPanel({ balanceLabel, balanceIcon, balance, enabled = true, queryKey, loadWallet, members, emptyText }: CreditDetailsPanelProps) {
    const [tab, setTab] = useState<LedgerTab>("income");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [jumpPage, setJumpPage] = useState("1");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [memberId, setMemberId] = useState<string>();
    const range = useMemo(() => ({
        ...(startDate ? { startTime: dateBoundary(startDate) } : {}),
        ...(endDate ? { endTime: dateBoundary(endDate, true) } : {}),
    }), [endDate, startDate]);
    const walletQuery = useQuery({
        queryKey: [...queryKey, tab, page, pageSize, range.startTime, range.endTime, memberId],
        queryFn: () => loadWallet({ page, pageSize, type: tab, ...range, ...(tab === "income" ? {} : { memberId }) }),
        enabled,
        placeholderData: keepPreviousData,
        staleTime: 15_000,
    });
    const wallet = walletQuery.data;
    const totalPages = Math.max(1, Math.ceil((wallet?.total || 0) / pageSize));
    const resolvedEmptyText = !enabled
        ? "积分功能当前未启用"
        : walletQuery.isError
            ? (walletQuery.error instanceof Error ? walletQuery.error.message : "积分明细加载失败")
            : emptyText || "当前筛选范围内没有积分记录";

    useEffect(() => {
        setJumpPage(String(page));
    }, [page]);

    const selectTab = (next: LedgerTab) => {
        setTab(next);
        setPage(1);
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
        <>
            <div className="credits-page__account">{balanceIcon ? <img src={balanceIcon} alt="" /> : null}<strong>{balance ?? (wallet ? formatCredits(wallet.account.availableMicrocredits, 6) : "--")}</strong><span>{balanceLabel}</span></div>

            <div className="credits-page__tabs" role="tablist" aria-label="积分明细类型">
                {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => selectTab(item.id)}>{item.label}</button>)}
            </div>

            <div className="credits-page__filters">
                <div className="credits-page__filter-fields">
                    <span>{tab === "income" ? "获取时间" : tab === "consume" ? "消耗时间" : "返还时间"}：</span>
                    <XingpeiRangePicker
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
                    {members && tab !== "income" ? (
                        <label className="credits-page__member-filter">
                            <span>选择成员：</span>
                            <XingpeiSelect
                                allowClear
                                value={memberId}
                                placeholder="请选择成员"
                                options={members.map((member) => ({ value: member.id, label: member.label }))}
                                onChange={(value) => {
                                    setMemberId(value);
                                    setPage(1);
                                }}
                            />
                        </label>
                    ) : null}
                </div>
                <span className="credits-page__total">{totalLabels[tab]}：<strong>{wallet ? formatCredits(Math.abs(wallet.totalAmountMicrocredits), 6) : "--"}</strong>积分</span>
            </div>

            <Table<CreditLedgerEntry>
                className="credits-page__table"
                columns={ledgerColumns(tab, Boolean(members))}
                dataSource={wallet?.entries || []}
                loading={walletQuery.isFetching}
                locale={{ emptyText: resolvedEmptyText }}
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
                    showSizeChanger={{
                        className: "credits-page__size-select",
                        suffixIcon: <img src={pageDropIcon} alt="" />,
                        classNames: { popup: { root: "credits-page__size-menu" } },
                    }}
                    showTotal={(total) => `共${total}笔`}
                    itemRender={(_, type, originalElement) => type === "prev" ? <img className="credits-page__page-arrow" src={pageLeftDisabled} alt="上一页" /> : type === "next" ? <img className="credits-page__page-arrow" src={pageRight} alt="下一页" /> : originalElement}
                    onChange={(nextPage, nextPageSize) => {
                        setPage(nextPageSize !== pageSize ? 1 : nextPage);
                        setPageSize(nextPageSize);
                    }}
                />
                <label className="credits-page__quick-jumper">
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
        </>
    );
}

function ledgerColumns(tab: LedgerTab, showMember: boolean): TableColumnsType<CreditLedgerEntry> {
    const pointsColumn = {
        title: tab === "income" ? "积分值" : tab === "consume" ? "消耗积分" : "返还积分",
        key: "points",
        width: tab === "income" ? "14%" : "15%",
        align: "right" as const,
        render: (_: unknown, entry: CreditLedgerEntry) => formatCredits(Math.abs(entry.amountMicrocredits), 6),
    };
    if (tab === "income") return [
        { title: "获取时间", dataIndex: "createdAt", key: "createdAt", width: "43%", render: formatDateTime },
        { title: "获取方式", key: "source", width: "43%", render: (_: unknown, entry) => incomeLabel(entry) },
        pointsColumn,
    ];
    return [
        { title: tab === "consume" ? "消耗时间" : "返还时间", dataIndex: "createdAt", key: "createdAt", width: "20%", render: formatDateTime },
        ...(showMember ? [{ title: "团队成员", dataIndex: "memberName", key: "memberName", width: "20%", render: (value?: string) => value || "—" }] : []),
        { title: "模型", dataIndex: "model", key: "model", width: showMember ? "20%" : "25%", render: (value?: string) => value || "—" },
        { title: "所属项目", dataIndex: "scene", key: "scene", width: showMember ? "25%" : "25%", render: (value?: string) => value || "—" },
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
