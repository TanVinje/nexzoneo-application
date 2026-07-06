import { useEffect, useState } from "react";
import { filesApi, imageUrl, publicApi, sellerApi, Product } from "../api";
import ConfirmDialog from "../ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { ProductGridSkeleton } from "../components/Skeleton";
import { useToast } from "../Toast";
import { colors } from "../theme";

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  stock_quantity: 0,
  category_id: "",
  order_method: "delivery",
  is_available: true,
  image_url: "",
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = () => sellerApi.products().then((r) => setProducts(r.data)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    publicApi.categories().then((r) => setCategories(r.data));
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Please use JPG, PNG, or WebP images.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5 MB.", "error");
      return;
    }
    setUploading(true);
    try {
      const { data } = await filesApi.upload(file);
      setForm((prev) => ({ ...prev, image_url: data.url }));
      toast("Image uploaded");
    } catch {
      toast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Product name is required";
    if (!form.category_id) errors.category_id = "Please select a category";
    if (form.price < 0) errors.price = "Price must be 0 or greater";
    if (form.stock_quantity < 0) errors.stock_quantity = "Stock cannot be negative";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast("Please fix the form errors", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, image_url: form.image_url || undefined };
      if (editing) {
        await sellerApi.updateProduct(editing, payload);
        toast("Product updated successfully");
      } else {
        await sellerApi.createProduct(payload);
        toast("Product created successfully");
      }
      closeForm();
      load();
    } catch {
      toast("Could not save product. Please check all fields.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { data } = await sellerApi.deleteProduct(deleteTarget.id);
      toast(data.message || (data.soft_deleted ? "Product hidden from store" : "Product deleted"));
      load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast(typeof detail === "string" ? detail : "Could not delete product", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      stock_quantity: p.stock_quantity,
      category_id: p.category_id,
      order_method: p.order_method,
      is_available: p.is_available,
      image_url: p.image_url || "",
    });
    setFieldErrors({});
    setShowForm(true);
  };

  return (
    <div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, color: colors.deepNavy }}>Product Management</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setFieldErrors({}); }}>
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: colors.deepNavy }}>{editing ? "Edit Product" : "New Product"}</h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              <span style={{ fontSize: 13 }}>Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ marginTop: 4, borderColor: fieldErrors.name ? colors.danger : undefined }} />
              {fieldErrors.name && <span style={{ fontSize: 12, color: colors.danger }}>{fieldErrors.name}</span>}
            </label>
            <label>
              <span style={{ fontSize: 13 }}>Category</span>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} style={{ marginTop: 4, borderColor: fieldErrors.category_id ? colors.danger : undefined }}>
                <option value="">Select...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {fieldErrors.category_id && <span style={{ fontSize: 12, color: colors.danger }}>{fieldErrors.category_id}</span>}
            </label>
            <label>
              <span style={{ fontSize: 13 }}>Price ($)</span>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} style={{ marginTop: 4, borderColor: fieldErrors.price ? colors.danger : undefined }} />
              {fieldErrors.price && <span style={{ fontSize: 12, color: colors.danger }}>{fieldErrors.price}</span>}
            </label>
            <label>
              <span style={{ fontSize: 13 }}>Stock</span>
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} style={{ marginTop: 4, borderColor: fieldErrors.stock_quantity ? colors.danger : undefined }} />
              {fieldErrors.stock_quantity && <span style={{ fontSize: 12, color: colors.danger }}>{fieldErrors.stock_quantity}</span>}
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 13 }}>Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ marginTop: 4 }} />
            </label>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Product Image</span>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 8 }}>
                <div style={{ width: 120, height: 120, background: colors.warmBeige, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {form.image_url ? (
                    <img src={imageUrl(form.image_url) || ""} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 32 }}>📷</span>
                  )}
                </div>
                <div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                  <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>JPG, PNG or WebP · max 5 MB</p>
                  {uploading && <p style={{ fontSize: 12, color: colors.softRoyalBlue }}>Uploading...</p>}
                </div>
              </div>
            </div>
            <label>
              <span style={{ fontSize: 13 }}>Order Method</span>
              <select value={form.order_method} onChange={(e) => setForm({ ...form, order_method: e.target.value })} style={{ marginTop: 4 }}>
                {["delivery", "pickup", "shipping", "request"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              Available
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary" disabled={saving || uploading}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 && !showForm ? (
        <EmptyState
          icon="📦"
          title="No products yet"
          message="Add your first product to start selling on Nexzoneo."
          actionLabel="Add Your First Product"
          onAction={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {products.map((p) => (
            <div key={p.id} className="card">
              <div style={{ height: 120, background: colors.warmBeige, borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {p.image_url ? (
                  <img src={imageUrl(p.image_url) || ""} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 40 }}>📦</span>
                )}
              </div>
              <h4 style={{ color: colors.deepNavy }}>{p.name}</h4>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0" }}>{p.description?.slice(0, 60)}</p>
              <p style={{ fontWeight: 700, fontSize: 18, color: colors.softRoyalBlue, margin: "8px 0" }}>${Number(p.price).toFixed(2)}</p>
              <p style={{ fontSize: 12, color: colors.textMuted }}>Stock: {p.stock_quantity} · {p.is_available ? "Available" : "Unavailable"}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn-secondary" style={{ flex: 1, fontSize: 13 }} onClick={() => startEdit(p)}>Edit</button>
                <button className="btn-danger" style={{ fontSize: 13 }} onClick={() => setDeleteTarget(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
