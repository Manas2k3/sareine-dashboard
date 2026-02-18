"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./dashboard.module.css";

/* ─── Types ─── */
interface RecentActivity {
    type: "order" | "preorder";
    id: string;
    customerName: string;
    amount: number;
    status: string;
    createdAt: unknown;
}

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    pendingPreorders: number;
    toDispatch: number;
    totalPreorders: number;
    revenueByDate: Record<string, number>;
    recentActivity: RecentActivity[];
}

/* ─── Status helpers ─── */
const STATUS_COLORS: Record<string, string> = {
    paid: "#22c55e",
    dispatched: "#8b5cf6",
    delivered: "#10b981",
    pending_confirmation: "#e6a817",
    payment_link_sent: "#3b82f6",
    cancelled: "#ef4444",
};

function formatDate(ts: unknown): string {
    if (!ts) return "—";
    if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
        return new Date(
            ((ts as { _seconds: number })._seconds) * 1000
        ).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
    if (typeof ts === "string") {
        return new Date(ts).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
    }
    return "—";
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <p>Loading dashboard…</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={styles.loadingWrap}>
                <p>Failed to load dashboard data.</p>
            </div>
        );
    }

    /* Revenue chart data */
    const chartEntries = Object.entries(stats.revenueByDate).sort(
        ([a], [b]) => a.localeCompare(b)
    );
    const maxRevenue = Math.max(...chartEntries.map(([, v]) => v), 1);

    return (
        <div className={styles.page}>
            {/* Page header */}
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSubtitle}>Overview of your Sareine business</p>
                </div>
                <button
                    type="button"
                    onClick={fetchStats}
                    className={styles.refreshBtn}
                    disabled={loading}
                    id="dashboard-refresh"
                >
                    ↻ Refresh
                </button>
            </header>

            {/* Stats cards */}
            <section className={styles.statsGrid} aria-label="Key metrics">
                <article className={styles.statCard}>
                    <span className={styles.statIcon}>📦</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalOrders}</span>
                        <span className={styles.statLabel}>Total Orders</span>
                    </div>
                </article>
                <article className={styles.statCard}>
                    <span className={styles.statIcon}>💰</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>₹{stats.totalRevenue.toLocaleString("en-IN")}</span>
                        <span className={styles.statLabel}>Total Revenue</span>
                    </div>
                </article>
                <article className={styles.statCard}>
                    <span className={styles.statIcon}>🕐</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.pendingPreorders}</span>
                        <span className={styles.statLabel}>Pending Preorders</span>
                    </div>
                </article>
                <article className={styles.statCard}>
                    <span className={styles.statIcon}>🚚</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.toDispatch}</span>
                        <span className={styles.statLabel}>To Dispatch</span>
                    </div>
                </article>
            </section>

            {/* Revenue Chart */}
            {chartEntries.length > 0 && (
                <section className={styles.chartSection} aria-label="Revenue chart">
                    <h2 className={styles.sectionTitle}>Revenue (Last 30 Days)</h2>
                    <div className={styles.chartContainer}>
                        {chartEntries.map(([date, amount]) => (
                            <div key={date} className={styles.chartBar}>
                                <div className={styles.chartBarTooltip}>
                                    ₹{amount.toLocaleString("en-IN")}
                                </div>
                                <div
                                    className={styles.chartBarFill}
                                    style={{ height: `${(amount / maxRevenue) * 100}%` }}
                                />
                                <span className={styles.chartBarLabel}>
                                    {new Date(date).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Activity */}
            <section className={styles.activitySection} aria-label="Recent activity">
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                {stats.recentActivity.length === 0 ? (
                    <p className={styles.emptyText}>No recent activity.</p>
                ) : (
                    <div className={styles.activityList}>
                        {stats.recentActivity.map((item) => (
                            <article key={`${item.type}-${item.id}`} className={styles.activityItem}>
                                <span className={styles.activityIcon}>
                                    {item.type === "order" ? "📦" : "🕐"}
                                </span>
                                <div className={styles.activityInfo}>
                                    <span className={styles.activityName}>
                                        {item.customerName}
                                    </span>
                                    <span className={styles.activityMeta}>
                                        {item.type === "order" ? "Order" : "Preorder"} · ₹{item.amount} · {formatDate(item.createdAt)}
                                    </span>
                                </div>
                                <span
                                    className={styles.activityStatus}
                                    style={{
                                        background: `${STATUS_COLORS[item.status] || "#666"}18`,
                                        color: STATUS_COLORS[item.status] || "#666",
                                        borderColor: `${STATUS_COLORS[item.status] || "#666"}40`,
                                    }}
                                >
                                    {item.status.replace(/_/g, " ")}
                                </span>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
