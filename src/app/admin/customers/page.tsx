"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./customers.module.css";

/* ─── Types ─── */
interface CustomerOrder {
    id: string;
    amount: number;
    status: string;
    createdAt: unknown;
    items: Array<{ name: string; price: number; quantity: number }>;
}

interface Customer {
    id: string;
    displayName: string;
    email: string;
    phone: string;
    photoURL: string;
    orderCount: number;
    totalSpend: number;
    orders: CustomerOrder[];
    createdAt: unknown;
}

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

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/customers/list?${params}`);
            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (err) {
            console.error("Failed to fetch customers:", err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Customers</h1>
                    <p className={styles.pageSubtitle}>{customers.length} registered customers</p>
                </div>
            </header>

            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Search by name, email, or phone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                    id="customers-search"
                    aria-label="Search customers"
                />
            </div>

            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading customers…</p>
                </div>
            ) : customers.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <p>No customers found.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Orders</th>
                                <th>Total Spend</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => {
                                const isExpanded = expandedId === c.id;
                                return (
                                    <>
                                        <tr
                                            key={c.id}
                                            className={`${styles.row} ${isExpanded ? styles.rowExpanded : ""}`}
                                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                        >
                                            <td>
                                                <div className={styles.customerCell}>
                                                    {c.photoURL ? (
                                                        <img
                                                            src={c.photoURL}
                                                            alt=""
                                                            className={styles.avatar}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            {(c.displayName || "?")[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className={styles.customerName}>{c.displayName}</span>
                                                </div>
                                            </td>
                                            <td className={styles.emailCell}>{c.email}</td>
                                            <td className={styles.ordersCell}>{c.orderCount}</td>
                                            <td className={styles.spendCell}>
                                                ₹{c.totalSpend.toLocaleString("en-IN")}
                                            </td>
                                            <td className={styles.dateCell}>{formatDate(c.createdAt)}</td>
                                            <td>
                                                <button type="button" className={styles.expandBtn} aria-label={isExpanded ? "Collapse" : "Expand"}>
                                                    {isExpanded ? "▲" : "▼"}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr key={`${c.id}-detail`} className={styles.detailRow}>
                                                <td colSpan={6}>
                                                    <div className={styles.detailContent}>
                                                        <div className={styles.detailHeader}>
                                                            <h3>Order History</h3>
                                                            {c.phone && <p>📞 {c.phone}</p>}
                                                        </div>
                                                        {c.orders.length === 0 ? (
                                                            <p className={styles.noOrders}>No orders yet</p>
                                                        ) : (
                                                            <div className={styles.orderList}>
                                                                {c.orders.map((order) => (
                                                                    <div key={order.id} className={styles.orderCard}>
                                                                        <div className={styles.orderMeta}>
                                                                            <span className={styles.orderId}>{order.id.slice(0, 8)}…</span>
                                                                            <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                                                                        </div>
                                                                        <div className={styles.orderInfo}>
                                                                            <span>₹{Number(order.amount).toLocaleString("en-IN")}</span>
                                                                            <span className={styles.orderStatus} style={{ color: order.status === "delivered" ? "#22c55e" : order.status === "paid" ? "#3b82f6" : "#e6a817" }}>
                                                                                {order.status}
                                                                            </span>
                                                                        </div>
                                                                        {order.items && (
                                                                            <div className={styles.orderItems}>
                                                                                {order.items.map((item, i) => (
                                                                                    <span key={i}>{item.name} ×{item.quantity}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
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
