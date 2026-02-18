"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./emails.module.css";

/* ─── Types ─── */
interface EmailLog {
    id: string;
    type: string;
    recipient: string;
    subject: string;
    success: boolean;
    error?: string;
    sentAt: string;
}

const TEMPLATE_PREVIEWS = [
    { key: "order_confirmation", label: "Order Confirmation", desc: "Sent after successful payment" },
    { key: "preorder_confirmation", label: "Preorder Confirmed", desc: "Sent when preorder is placed" },
    { key: "payment_link", label: "Payment Link", desc: "Sent with payment link for preorder" },
    { key: "dispatch", label: "Dispatch", desc: "Sent when order is shipped" },
    { key: "delivery", label: "Delivery", desc: "Sent when order is delivered" },
    { key: "promotional", label: "Promotional", desc: "Marketing / announcement emails" },
    { key: "welcome", label: "Welcome", desc: "Sent on first sign-up" },
];

export default function EmailsPage() {
    const [activeTab, setActiveTab] = useState<"compose" | "logs">("compose");
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [sending, setSending] = useState(false);

    /* Compose form */
    const [emailType, setEmailType] = useState("custom");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [heading, setHeading] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [ctaUrl, setCtaUrl] = useState("");

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await fetch("/api/admin/emails/log");
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "logs") fetchLogs();
    }, [activeTab, fetchLogs]);

    const handleSend = async () => {
        if (!recipientEmail && emailType !== "promotional") {
            alert("Please enter a recipient email");
            return;
        }
        setSending(true);
        try {
            const payload: Record<string, unknown> = { type: emailType };

            if (emailType === "custom") {
                payload.recipientEmail = recipientEmail;
                payload.subject = subject;
                payload.heading = heading;
                payload.bodyText = bodyText;
            } else if (emailType === "promotional") {
                payload.recipients = recipientEmail
                    ? recipientEmail.split(",").map((e) => e.trim())
                    : [];
                payload.subject = subject;
                payload.heading = heading;
                payload.bodyText = bodyText;
                payload.ctaText = ctaText;
                payload.ctaUrl = ctaUrl;
            } else if (emailType === "welcome") {
                payload.customerName = heading || "Customer";
                payload.customerEmail = recipientEmail;
            }

            const res = await fetch("/api/admin/emails/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("Email sent successfully!");
                setRecipientEmail("");
                setSubject("");
                setHeading("");
                setBodyText("");
                setCtaText("");
                setCtaUrl("");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to send");
            }
        } catch {
            alert("Network error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Emails</h1>
                    <p className={styles.pageSubtitle}>Send and manage email communications</p>
                </div>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "compose" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("compose")}
                >
                    ✉️ Compose
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === "logs" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("logs")}
                >
                    📋 Email Logs
                </button>
            </div>

            {activeTab === "compose" ? (
                <div className={styles.composeSection}>
                    {/* Template cards */}
                    <section className={styles.templatesSection} aria-label="Email templates">
                        <h2 className={styles.sectionTitle}>Templates</h2>
                        <div className={styles.templateGrid}>
                            {TEMPLATE_PREVIEWS.map((t) => (
                                <article
                                    key={t.key}
                                    className={`${styles.templateCard} ${emailType === t.key ? styles.templateCardActive : ""}`}
                                    onClick={() => setEmailType(t.key)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") setEmailType(t.key);
                                    }}
                                >
                                    <h3>{t.label}</h3>
                                    <p>{t.desc}</p>
                                </article>
                            ))}
                            <article
                                className={`${styles.templateCard} ${emailType === "custom" ? styles.templateCardActive : ""}`}
                                onClick={() => setEmailType("custom")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") setEmailType("custom");
                                }}
                            >
                                <h3>Custom</h3>
                                <p>Write a custom email</p>
                            </article>
                        </div>
                    </section>

                    {/* Compose form */}
                    <section className={styles.composeForm} aria-label="Compose email">
                        <h2 className={styles.sectionTitle}>
                            Compose — {TEMPLATE_PREVIEWS.find((t) => t.key === emailType)?.label || "Custom"}
                        </h2>
                        <div className={styles.formStack}>
                            <label className={styles.formField}>
                                <span>{emailType === "promotional" ? "Recipients (comma separated, empty = all)" : "Recipient Email"}</span>
                                <input
                                    type="text"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder={emailType === "promotional" ? "All customers if empty" : "customer@email.com"}
                                />
                            </label>

                            {(emailType === "custom" || emailType === "promotional") && (
                                <>
                                    <label className={styles.formField}>
                                        <span>Subject</span>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Email subject"
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>Heading</span>
                                        <input
                                            type="text"
                                            value={heading}
                                            onChange={(e) => setHeading(e.target.value)}
                                            placeholder="Email heading"
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>Body</span>
                                        <textarea
                                            value={bodyText}
                                            onChange={(e) => setBodyText(e.target.value)}
                                            rows={5}
                                            placeholder="Email content"
                                        />
                                    </label>
                                </>
                            )}

                            {emailType === "promotional" && (
                                <div className={styles.ctaRow}>
                                    <label className={styles.formField}>
                                        <span>CTA Button Text</span>
                                        <input
                                            type="text"
                                            value={ctaText}
                                            onChange={(e) => setCtaText(e.target.value)}
                                            placeholder="Shop Now"
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>CTA URL</span>
                                        <input
                                            type="text"
                                            value={ctaUrl}
                                            onChange={(e) => setCtaUrl(e.target.value)}
                                            placeholder="https://sareine.in"
                                        />
                                    </label>
                                </div>
                            )}

                            {emailType === "welcome" && (
                                <label className={styles.formField}>
                                    <span>Customer Name</span>
                                    <input
                                        type="text"
                                        value={heading}
                                        onChange={(e) => setHeading(e.target.value)}
                                        placeholder="Customer name"
                                    />
                                </label>
                            )}

                            <button
                                type="button"
                                className={styles.sendBtn}
                                disabled={sending}
                                onClick={handleSend}
                                id="send-email"
                            >
                                {sending ? "Sending…" : "📧 Send Email"}
                            </button>
                        </div>
                    </section>
                </div>
            ) : (
                /* Logs tab */
                <section className={styles.logsSection}>
                    {logsLoading ? (
                        <div className={styles.loadingWrap}>
                            <div className={styles.spinner} />
                            <p>Loading logs…</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className={styles.emptyWrap}>
                            <p>No email logs yet.</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Recipient</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className={styles.logRow}>
                                            <td className={styles.typeCell}>{log.type}</td>
                                            <td>{log.recipient}</td>
                                            <td>{log.subject}</td>
                                            <td>
                                                <span className={log.success ? styles.successBadge : styles.failBadge}>
                                                    {log.success ? "Sent" : "Failed"}
                                                </span>
                                            </td>
                                            <td className={styles.dateCell}>
                                                {new Date(log.sentAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
