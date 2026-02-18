"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

/* ─── Admin secret ─── */
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "sareine2026";

/* ─── Navigation items ─── */
const NAV_ITEMS = [
    {
        section: "Overview",
        links: [
            { href: "/admin", label: "Dashboard", icon: "📊" },
        ],
    },
    {
        section: "Management",
        links: [
            { href: "/admin/orders", label: "Orders", icon: "📦" },
            { href: "/admin/preorders", label: "Preorders", icon: "🕐" },
            { href: "/admin/products", label: "Products", icon: "💄" },
            { href: "/admin/customers", label: "Customers", icon: "👥" },
        ],
    },
    {
        section: "Communication",
        links: [
            { href: "/admin/emails", label: "Emails", icon: "✉️" },
        ],
    },
    {
        section: "System",
        links: [
            { href: "/admin/settings", label: "Settings", icon: "⚙️" },
        ],
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [isAuthed, setIsAuthed] = useState(false);
    const [secret, setSecret] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    /* Check sessionStorage on mount */
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("sareine_admin_auth");
            if (stored === "true") setIsAuthed(true);
        }
    }, []);

    const handleLogin = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (secret === ADMIN_SECRET) {
                setIsAuthed(true);
                sessionStorage.setItem("sareine_admin_auth", "true");
            } else {
                alert("Incorrect password");
            }
        },
        [secret]
    );

    const handleLogout = useCallback(() => {
        setIsAuthed(false);
        sessionStorage.removeItem("sareine_admin_auth");
    }, []);

    /* Close sidebar on route change (mobile) */
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    /* ─── Login gate ─── */
    if (!isAuthed) {
        return (
            <main className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <h1 className={styles.loginTitle}>SAREINE</h1>
                    <p className={styles.loginSubtitle}>Enter admin password to continue</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className={styles.loginInput}
                            placeholder="Password"
                            autoFocus
                            id="admin-password"
                            aria-label="Admin password"
                        />
                        <button type="submit" className={styles.loginBtn}>
                            Enter Dashboard
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    /* ─── Dashboard layout ─── */
    return (
        <div className={styles.layoutShell}>
            {/* Mobile hamburger */}
            <button
                type="button"
                className={`${styles.hamburger} ${sidebarOpen ? styles.hamburgerOpen : ""}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                id="admin-hamburger"
            >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
            </button>

            {/* Overlay for mobile */}
            <div
                className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ""}`}
                onClick={() => setSidebarOpen(false)}
                role="presentation"
            />

            {/* Sidebar */}
            <aside
                className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
                role="navigation"
                aria-label="Admin navigation"
            >
                <header className={styles.sidebarHeader}>
                    <Link href="/admin" className={styles.sidebarBrand}>
                        SAREINE
                        <span className={styles.sidebarBrandSub}>Admin Dashboard</span>
                    </Link>
                </header>

                <nav className={styles.sidebarNav}>
                    {NAV_ITEMS.map((section) => (
                        <div key={section.section} className={styles.navSection}>
                            <div className={styles.navSectionLabel}>{section.section}</div>
                            {section.links.map((link) => {
                                const isActive =
                                    link.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                                        id={`nav-${link.label.toLowerCase()}`}
                                    >
                                        <span className={styles.navIcon} aria-hidden="true">
                                            {link.icon}
                                        </span>
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <footer className={styles.sidebarFooter}>
                    <button
                        type="button"
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        id="admin-logout"
                    >
                        Sign Out
                    </button>
                </footer>
            </aside>

            {/* Main content */}
            <main className={styles.mainContent}>{children}</main>
        </div>
    );
}
