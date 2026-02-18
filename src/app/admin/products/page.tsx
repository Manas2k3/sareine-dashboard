"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./products.module.css";

/* ─── Types ─── */
interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    slug: string;
    category: string;
    inStock: boolean;
    image?: string;
    tagline?: string;
    weight?: string;
    packaging?: string;
    howToUse?: string;
    ingredients?: string[];
    features?: string[];
    benefits?: string[];
}

const EMPTY_PRODUCT: Omit<Product, "id"> = {
    name: "",
    price: 0,
    description: "",
    slug: "",
    category: "lip-care",
    inStock: true,
    image: "",
    tagline: "",
    weight: "",
    packaging: "",
    howToUse: "",
    ingredients: [],
    features: [],
    benefits: [],
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | "edit" | null>(null);
    const [editData, setEditData] = useState<Partial<Product>>(EMPTY_PRODUCT);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/products/list");
            const data = await res.json();
            setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    /* Open edit */
    const openEdit = (product: Product) => {
        setEditData(product);
        setModal("edit");
    };

    /* Save product */
    const handleSave = async () => {
        setSaving(true);
        try {
            const endpoint =
                modal === "create" ? "/api/admin/products/create" : "/api/admin/products/update";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                setModal(null);
                setEditData(EMPTY_PRODUCT);
                await fetchProducts();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save");
            }
        } catch {
            alert("Network error");
        } finally {
            setSaving(false);
        }
    };

    /* Delete product */
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch("/api/admin/products/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setDeleteConfirm(null);
                await fetchProducts();
            } else {
                alert("Failed to delete");
            }
        } catch {
            alert("Network error");
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Products</h1>
                    <p className={styles.pageSubtitle}>{products.length} products in catalog</p>
                </div>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => {
                        setEditData(EMPTY_PRODUCT);
                        setModal("create");
                    }}
                    id="add-product"
                >
                    + Add Product
                </button>
            </header>

            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading products…</p>
                </div>
            ) : products.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <p>No products yet. Add your first product!</p>
                </div>
            ) : (
                <div className={styles.productGrid}>
                    {products.map((product) => (
                        <article key={product.id} className={styles.productCard}>
                            {product.image && (
                                <div className={styles.productImage}>
                                    <img src={product.image} alt={product.name} loading="lazy" />
                                </div>
                            )}
                            <div className={styles.productBody}>
                                <h3 className={styles.productName}>{product.name}</h3>
                                <p className={styles.productSlug}>{product.slug}</p>
                                <div className={styles.productMeta}>
                                    <span className={styles.productPrice}>
                                        ₹{product.price.toLocaleString("en-IN")}
                                    </span>
                                    <span
                                        className={`${styles.stockBadge} ${product.inStock ? styles.inStock : styles.outOfStock
                                            }`}
                                    >
                                        {product.inStock ? "In Stock" : "Out of Stock"}
                                    </span>
                                </div>
                                <p className={styles.productDesc}>
                                    {product.description?.slice(0, 100)}
                                    {product.description?.length > 100 ? "…" : ""}
                                </p>
                            </div>
                            <div className={styles.productActions}>
                                <button
                                    type="button"
                                    className={styles.editBtn}
                                    onClick={() => openEdit(product)}
                                >
                                    ✏️ Edit
                                </button>
                                {deleteConfirm === product.id ? (
                                    <div className={styles.confirmDelete}>
                                        <span className={styles.confirmText}>Delete?</span>
                                        <button
                                            type="button"
                                            className={styles.confirmYes}
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.confirmNo}
                                            onClick={() => setDeleteConfirm(null)}
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.deleteBtn}
                                        onClick={() => setDeleteConfirm(product.id)}
                                    >
                                        🗑
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className={styles.modalOverlay} onClick={() => setModal(null)} role="dialog" aria-modal="true">
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <header className={styles.modalHeader}>
                            <h2>{modal === "create" ? "Add Product" : "Edit Product"}</h2>
                            <button type="button" className={styles.modalClose} onClick={() => setModal(null)}>
                                ×
                            </button>
                        </header>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <label className={styles.formField}>
                                    <span>Name *</span>
                                    <input
                                        type="text"
                                        value={editData.name || ""}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Slug *</span>
                                    <input
                                        type="text"
                                        value={editData.slug || ""}
                                        onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Price (₹) *</span>
                                    <input
                                        type="number"
                                        value={editData.price || 0}
                                        onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Category</span>
                                    <input
                                        type="text"
                                        value={editData.category || ""}
                                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Image URL</span>
                                    <input
                                        type="text"
                                        value={editData.image || ""}
                                        onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Tagline</span>
                                    <input
                                        type="text"
                                        value={editData.tagline || ""}
                                        onChange={(e) => setEditData({ ...editData, tagline: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Weight</span>
                                    <input
                                        type="text"
                                        value={editData.weight || ""}
                                        onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Packaging</span>
                                    <input
                                        type="text"
                                        value={editData.packaging || ""}
                                        onChange={(e) => setEditData({ ...editData, packaging: e.target.value })}
                                    />
                                </label>
                                <label className={`${styles.formField} ${styles.fullWidth}`}>
                                    <span>Description</span>
                                    <textarea
                                        value={editData.description || ""}
                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        rows={3}
                                    />
                                </label>
                                <label className={`${styles.formField} ${styles.fullWidth}`}>
                                    <span>How to Use</span>
                                    <textarea
                                        value={editData.howToUse || ""}
                                        onChange={(e) => setEditData({ ...editData, howToUse: e.target.value })}
                                        rows={2}
                                    />
                                </label>
                                <label className={`${styles.formField} ${styles.fullWidth}`}>
                                    <span>Ingredients (comma separated)</span>
                                    <input
                                        type="text"
                                        value={(editData.ingredients || []).join(", ")}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                ingredients: e.target.value.split(",").map((i) => i.trim()),
                                            })
                                        }
                                    />
                                </label>
                                <label className={styles.formCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={editData.inStock !== false}
                                        onChange={(e) => setEditData({ ...editData, inStock: e.target.checked })}
                                    />
                                    <span>In Stock</span>
                                </label>
                            </div>
                        </div>
                        <footer className={styles.modalFooter}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.saveBtn}
                                disabled={saving || !editData.name || !editData.slug}
                                onClick={handleSave}
                            >
                                {saving ? "Saving…" : modal === "create" ? "Create Product" : "Save Changes"}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
