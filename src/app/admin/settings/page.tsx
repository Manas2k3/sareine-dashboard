"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./settings.module.css";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        preorderEnabled: false,
        announcementText: "",
        senderName: "Sareine",
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings || settings);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert("Settings saved!");
            } else {
                alert("Failed to save settings");
            }
        } catch {
            alert("Network error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Settings</h1>
                <p className={styles.pageSubtitle}>Configure your Sareine admin dashboard</p>
            </header>

            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading settings…</p>
                </div>
            ) : (
                <div className={styles.settingsGrid}>
                    {/* Preorder Toggle */}
                    <section className={styles.settingCard} aria-label="Preorder mode">
                        <header className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Preorder Mode</h2>
                                <p className={styles.cardDesc}>
                                    When enabled, the main site shows preorder flow instead of direct checkout.
                                </p>
                            </div>
                        </header>
                        <div className={styles.cardBody}>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.preorderEnabled}
                                    onChange={(e) =>
                                        setSettings({ ...settings, preorderEnabled: e.target.checked })
                                    }
                                />
                                <span className={styles.toggleTrack}>
                                    <span className={styles.toggleThumb} />
                                </span>
                                <span className={styles.toggleLabel}>
                                    {settings.preorderEnabled ? "Enabled" : "Disabled"}
                                </span>
                            </label>
                        </div>
                    </section>

                    {/* Announcement Banner */}
                    <section className={styles.settingCard} aria-label="Announcement banner">
                        <header className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Announcement Banner</h2>
                                <p className={styles.cardDesc}>
                                    Text displayed in the site announcement bar. Leave empty to hide.
                                </p>
                            </div>
                        </header>
                        <div className={styles.cardBody}>
                            <textarea
                                className={styles.textareaInput}
                                value={settings.announcementText}
                                onChange={(e) =>
                                    setSettings({ ...settings, announcementText: e.target.value })
                                }
                                rows={3}
                                placeholder="e.g. Limited Edition collection launching soon!"
                            />
                        </div>
                    </section>

                    {/* Sender Name */}
                    <section className={styles.settingCard} aria-label="Email sender name">
                        <header className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Email Sender Name</h2>
                                <p className={styles.cardDesc}>
                                    The display name used in outgoing emails.
                                </p>
                            </div>
                        </header>
                        <div className={styles.cardBody}>
                            <input
                                type="text"
                                className={styles.textInput}
                                value={settings.senderName}
                                onChange={(e) =>
                                    setSettings({ ...settings, senderName: e.target.value })
                                }
                                placeholder="Sareine"
                            />
                        </div>
                    </section>

                    {/* Admin Password */}
                    <section className={styles.settingCard} aria-label="Admin access">
                        <header className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Admin Access</h2>
                                <p className={styles.cardDesc}>
                                    Password is configured via <code>NEXT_PUBLIC_ADMIN_SECRET</code> environment variable.
                                </p>
                            </div>
                        </header>
                        <div className={styles.cardBody}>
                            <p className={styles.envNote}>
                                Current: Set in <code>.env.local</code> — requires redeployment to change.
                            </p>
                        </div>
                    </section>

                    {/* Save */}
                    <div className={styles.saveRow}>
                        <button
                            type="button"
                            className={styles.saveBtn}
                            disabled={saving}
                            onClick={handleSave}
                            id="save-settings"
                        >
                            {saving ? "Saving…" : "💾 Save Settings"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
