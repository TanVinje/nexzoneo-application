import { useEffect, useState } from "react";
import { filesApi, imageUrl, sellerApi, WhiteLabelConfig } from "../api";
import { useToast } from "../Toast";
import { colors } from "../theme";

export default function BrandingPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    sellerApi.whiteLabel().then((r) => setConfig(r.data));
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Please use JPG, PNG, or WebP images.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Logo must be under 5 MB.", "error");
      return;
    }
    setUploading(true);
    try {
      const { data } = await filesApi.upload(file);
      setConfig({ ...config, logo_url: data.url });
      toast("Logo uploaded");
    } catch {
      toast("Failed to upload logo", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const { data } = await sellerApi.updateWhiteLabel(config);
      setConfig(data);
      toast("Branding saved successfully");
    } catch {
      toast("Could not save branding", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <p>Loading...</p>;

  return (
    <div>
      <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>White-Label Branding</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <form onSubmit={handleSave} className="card">
          <h3 style={{ marginBottom: 20, color: colors.deepNavy }}>Brand Settings</h3>

          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Logo</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 8 }}>
              <div style={{
                width: 80, height: 80, background: colors.warmBeige, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {config.logo_url ? (
                  <img src={imageUrl(config.logo_url) || ""} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 28 }}>🏪</span>
                )}
              </div>
              <div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>JPG, PNG or WebP · max 5 MB</p>
                {uploading && <p style={{ fontSize: 12, color: colors.softRoyalBlue }}>Uploading...</p>}
                {config.logo_url && (
                  <button type="button" style={{ fontSize: 12, color: colors.danger, background: "none", padding: 0, marginTop: 4 }} onClick={() => setConfig({ ...config, logo_url: "" })}>
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {(
            [
              { key: "app_name" as const, label: "App Name" },
              { key: "welcome_text" as const, label: "Welcome Text" },
              { key: "banner_title" as const, label: "Home Banner Title" },
              { key: "banner_subtitle" as const, label: "Home Banner Subtitle" },
              { key: "primary_color" as const, label: "Primary Color", type: "color" },
              { key: "secondary_color" as const, label: "Secondary Color", type: "color" },
            ] as const
          ).map((field) => (
            <label key={field.key} style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{field.label}</span>
              <input
                type={"type" in field ? field.type : "text"}
                value={config[field.key] || ""}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                style={{ marginTop: 6 }}
              />
            </label>
          ))}
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Flat delivery fee (deferred)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={0}
              disabled
              style={{ marginTop: 6, opacity: 0.6 }}
            />
            <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              Delivery fees are deferred for now (checkout shows pickup vs delivery only, fee = $0).
              Fee rules can be enabled later without a rebuild.
            </p>
          </label>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Tax rate (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={config.tax_rate_percent ?? 0}
              onChange={(e) => setConfig({ ...config, tax_rate_percent: Number(e.target.value) })}
              style={{ marginTop: 6 }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={config.marketplace_mode_enabled} onChange={(e) => setConfig({ ...config, marketplace_mode_enabled: e.target.checked })} />
            Marketplace Mode (show other sellers&apos; products)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <input type="checkbox" checked={config.ranking_boost_enabled} onChange={(e) => setConfig({ ...config, ranking_boost_enabled: e.target.checked })} />
            Ranking Boost (your products appear first)
          </label>
          <button type="submit" className="btn-primary" disabled={saving || uploading}>
            {saving ? "Saving..." : "Save Branding"}
          </button>
        </form>

        <div className="card">
          <h3 style={{ marginBottom: 20, color: colors.deepNavy }}>Preview</h3>
          <div style={{ background: config.primary_color, color: "white", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: config.secondary_color,
              margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {config.logo_url ? (
                <img src={imageUrl(config.logo_url) || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 28 }}>🏪</span>
              )}
            </div>
            <h4 style={{ fontSize: 22 }}>{config.app_name}</h4>
            <p style={{ opacity: 0.9, marginTop: 8, fontSize: 16, fontWeight: 600 }}>{config.banner_title || "Order ahead"}</p>
            <p style={{ opacity: 0.8, marginTop: 4, fontSize: 14 }}>{config.banner_subtitle || config.welcome_text}</p>
            <p style={{ opacity: 0.7, marginTop: 12, fontSize: 12 }}>
              Pickup or delivery · fees coming later
              {Number(config.tax_rate_percent || 0) > 0 ? ` · Tax ${config.tax_rate_percent}%` : ""}
            </p>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <div style={{ flex: 1, height: 40, background: config.primary_color, borderRadius: 6 }} />
            <div style={{ flex: 1, height: 40, background: config.secondary_color, borderRadius: 6 }} />
            <div style={{ flex: 1, height: 40, background: colors.warmBeige, borderRadius: 6 }} />
          </div>
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 16 }}>
            Approved brand colors: Deep Navy #141B4D, Soft Royal Blue #53619A, Muted Blue #7890B0, Warm Beige #E9DFCC
          </p>
        </div>
      </div>
    </div>
  );
}
