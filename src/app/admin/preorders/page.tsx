"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./preorders.module.css";

/* ─── Types ─── */
interface PreorderItem {
    name: string;
    price: number;
    quantity: number;
}

interface Preorder {
    id: string;
    preorderId: string;
    customerName: string;
    customerEmail: string;
    phone: string;
    amount: number;
    status: string;
    items: PreorderItem[];
    shippingAddress: {
        name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    createdAt: unknown;
}

const STATUS_COLORS: Record<string, string> = {
    pending_confirmation: "#e6a817",
    payment_link_sent: "#3b82f6",
    paid: "#22c55e",
    cancelled: "#ef4444",
};

function formatDate(ts: unknown): string {
    if (!ts) return "—";
    if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
        return new Date(
            ((ts as { _seconds: number })._seconds) * 1000
        ).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    if (typeof ts === "string") return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return "—";
}

export default function PreordersPage() {
    const [preorders, setPreorders] = useState<Preorder[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPreorders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/preorders/list");
            const data = await res.json();
            setPreorders(data.preorders || []);
        } catch (err) {
            console.error("Failed to fetch preorders:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreorders();
    }, [fetchPreorders]);

    /* Send payment link */
    /* Send payment link */
    const sendPaymentLink = async (preorder: Preorder) => {
        setActionLoading(preorder.id);
        try {
            // 1. Generate Payment Link
            const linkRes = await fetch("/api/razorpay/create-payment-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: preorder.amount,
                    customerName: preorder.customerName,
                    customerEmail: preorder.customerEmail,
                    phone: preorder.shippingAddress?.phone || preorder.phone,
                    preorderId: preorder.preorderId,
                }),
            });
            const linkData = await linkRes.json();

            if (!linkRes.ok || !linkData.short_url) {
                alert("Failed to generate payment link: " + (linkData.error || "Unknown error"));
                setActionLoading(null);
                return;
            }

            const paymentLink = linkData.short_url;

            // 2. Send Email
            const emailRes = await fetch("/api/admin/emails/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "payment_link",
                    customerName: preorder.customerName,
                    customerEmail: preorder.customerEmail,
                    preorderId: preorder.preorderId,
                    amount: preorder.amount,
                    paymentLink,
                }),
            });

            if (emailRes.ok) {
                /* Update status */
                await fetch("/api/admin/preorders/update-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firestoreId: preorder.id,
                        status: "payment_link_sent",
                    }),
                });
                await fetchPreorders();
                alert("Payment link generated and sent!");
            } else {
                alert("Failed to send email");
            }
        } catch (error) {
            console.error(error);
            alert("Network error");
        } finally {
            setActionLoading(null);
        }
    };

    /* Status counts */
    const statusCounts = preorders.reduce(
        (acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Preorders</h1>
                    <p className={styles.pageSubtitle}>{preorders.length} total preorders</p>
                </div>
            </header>

            {/* Status counts */}
            <div className={styles.statusRow}>
                {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className={styles.statusCard}>
                        <span className={styles.statusCount}>{count}</span>
                        <span className={styles.statusLabel}>{status.replace(/_/g, " ")}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading preorders…</p>
                </div>
            ) : preorders.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <p>No preorders yet.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Preorder ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {preorders.map((po) => {
                                const isExpanded = expandedId === po.id;
                                const isActioning = actionLoading === po.id;
                                return (
                                    <>
                                        <tr
                                            key={po.id}
                                            className={`${styles.row} ${isExpanded ? styles.rowExpanded : ""}`}
                                            onClick={() => setExpandedId(isExpanded ? null : po.id)}
                                        >
                                            <td className={styles.idCell}>{po.preorderId}</td>
                                            <td>
                                                <div className={styles.customerCell}>
                                                    <span className={styles.customerName}>{po.customerName}</span>
                                                    <span className={styles.customerEmail}>{po.customerEmail}</span>
                                                </div>
                                            </td>
                                            <td className={styles.amountCell}>₹{Number(po.amount).toLocaleString("en-IN")}</td>
                                            <td>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{
                                                        background: `${STATUS_COLORS[po.status] || "#666"}18`,
                                                        color: STATUS_COLORS[po.status] || "#666",
                                                        borderColor: `${STATUS_COLORS[po.status] || "#666"}40`,
                                                    }}
                                                >
                                                    {po.status.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className={styles.dateCell}>{formatDate(po.createdAt)}</td>
                                            <td>
                                                <button type="button" className={styles.expandBtn} aria-label={isExpanded ? "Collapse" : "Expand"}>
                                                    {isExpanded ? "▲" : "▼"}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr key={`${po.id}-detail`} className={styles.detailRow}>
                                                <td colSpan={6}>
                                                    <div className={styles.detailGrid}>
                                                        <div className={styles.detailBlock}>
                                                            <h4>Items</h4>
                                                            {(po.items || []).map((item, i) => (
                                                                <div key={i} className={styles.detailItem}>
                                                                    <span>{item.name}</span>
                                                                    <span>{item.quantity} × ₹{item.price}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {po.shippingAddress && (
                                                            <div className={styles.detailBlock}>
                                                                <h4>Shipping</h4>
                                                                <p className={styles.detailText}>
                                                                    {po.shippingAddress.name}<br />
                                                                    {po.shippingAddress.street}<br />
                                                                    {po.shippingAddress.city}, {po.shippingAddress.state} {po.shippingAddress.zip}<br />
                                                                    📞 {po.shippingAddress.phone || po.phone}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className={styles.detailActions}>
                                                            {po.status === "pending_confirmation" && (
                                                                <button
                                                                    type="button"
                                                                    className={styles.actionBtn}
                                                                    disabled={isActioning}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        sendPaymentLink(po);
                                                                    }}
                                                                >
                                                                    {isActioning ? "Sending…" : "💳 Send Payment Link"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
