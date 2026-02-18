"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./orders.module.css";

/* ─── Types ─── */
interface OrderItem {
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    firestoreId: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    status: string;
    items: OrderItem[];
    shippingAddress: {
        name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    createdAt: unknown;
}

const STATUS_OPTIONS = ["paid", "dispatched", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
    paid: "#22c55e",
    dispatched: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
};

function formatDate(ts: unknown): string {
    if (!ts) return "—";
    if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
        return new Date(
            ((ts as { _seconds: number })._seconds) * 1000
        ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
    if (typeof ts === "string") {
        return new Date(ts).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
    return "—";
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.set("status", filter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/orders/list?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    /* Update status */
    const updateStatus = async (
        firestoreId: string,
        newStatus: string,
        sendEmail: boolean
    ) => {
        setActionLoading(firestoreId);
        try {
            const res = await fetch("/api/admin/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firestoreId, status: newStatus, sendEmail }),
            });
            if (res.ok) {
                await fetchOrders();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update");
            }
        } catch {
            alert("Network error");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Orders</h1>
                    <p className={styles.pageSubtitle}>
                        {orders.length} total order{orders.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                    id="orders-search"
                    aria-label="Search orders"
                />
                <div className={styles.filterTabs}>
                    <button
                        type="button"
                        className={`${styles.filterTab} ${!filter ? styles.filterTabActive : ""}`}
                        onClick={() => setFilter("")}
                    >
                        All
                    </button>
                    {STATUS_OPTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`${styles.filterTab} ${filter === s ? styles.filterTabActive : ""}`}
                            onClick={() => setFilter(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading orders…</p>
                </div>
            ) : orders.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <p>No orders found.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table} role="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const isExpanded = expandedId === order.firestoreId;
                                const isActioning = actionLoading === order.firestoreId;
                                return (
                                    <>
                                        <tr
                                            key={order.firestoreId}
                                            className={`${styles.row} ${isExpanded ? styles.rowExpanded : ""}`}
                                            onClick={() =>
                                                setExpandedId(isExpanded ? null : order.firestoreId)
                                            }
                                        >
                                            <td>
                                                <div className={styles.customerCell}>
                                                    <span className={styles.customerName}>
                                                        {order.customerName || "Unknown"}
                                                    </span>
                                                    <span className={styles.customerEmail}>
                                                        {order.customerEmail}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.amountCell}>
                                                ₹{Number(order.amount).toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{
                                                        background: `${STATUS_COLORS[order.status] || "#666"}18`,
                                                        color: STATUS_COLORS[order.status] || "#666",
                                                        borderColor: `${STATUS_COLORS[order.status] || "#666"}40`,
                                                    }}
                                                >
                                                    {order.status.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className={styles.dateCell}>{formatDate(order.createdAt)}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.expandBtn}
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    {isExpanded ? "▲" : "▼"}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr key={`${order.firestoreId}-detail`} className={styles.detailRow}>
                                                <td colSpan={5}>
                                                    <div className={styles.detailGrid}>
                                                        {/* Items */}
                                                        <div className={styles.detailBlock}>
                                                            <h4>Items</h4>
                                                            {(order.items || []).map((item, i) => (
                                                                <div key={i} className={styles.detailItem}>
                                                                    <span>{item.name}</span>
                                                                    <span>
                                                                        {item.quantity} × ₹{item.price}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Shipping */}
                                                        {order.shippingAddress && (
                                                            <div className={styles.detailBlock}>
                                                                <h4>Shipping</h4>
                                                                <p className={styles.detailText}>
                                                                    {order.shippingAddress.name}<br />
                                                                    {order.shippingAddress.street}<br />
                                                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                                                    📞 {order.shippingAddress.phone}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Payment */}
                                                        <div className={styles.detailBlock}>
                                                            <h4>Payment</h4>
                                                            <p className={styles.detailText}>
                                                                {order.razorpayPaymentId ? (
                                                                    <>Payment ID: {order.razorpayPaymentId}</>
                                                                ) : (
                                                                    "No payment ID"
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className={styles.detailActions}>
                                                            {order.status === "paid" && (
                                                                <button
                                                                    type="button"
                                                                    className={styles.actionBtn}
                                                                    disabled={isActioning}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateStatus(
                                                                            order.firestoreId,
                                                                            "dispatched",
                                                                            true
                                                                        );
                                                                    }}
                                                                    id={`dispatch-${order.firestoreId}`}
                                                                >
                                                                    {isActioning ? "Sending…" : "🚚 Mark Dispatched & Send Email"}
                                                                </button>
                                                            )}
                                                            {order.status === "dispatched" && (
                                                                <button
                                                                    type="button"
                                                                    className={styles.actionBtn}
                                                                    disabled={isActioning}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateStatus(
                                                                            order.firestoreId,
                                                                            "delivered",
                                                                            true
                                                                        );
                                                                    }}
                                                                    id={`deliver-${order.firestoreId}`}
                                                                >
                                                                    {isActioning ? "Sending…" : "✅ Mark Delivered & Send Email"}
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
