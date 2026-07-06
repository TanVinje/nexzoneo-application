import { useEffect, useState } from "react";
import { authApi, sellerApi } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";
import { SkeletonBox } from "../components/Skeleton";
import { colors } from "../theme";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone || "");
    sellerApi.company().then((r) => {
      setCompanyName(r.data.name);
      setCompanyAddress(r.data.address || "");
      setCompanyEmail(r.data.email || "");
      setCompanyPhone(r.data.phone || "");
      setCompanyDesc(r.data.description || "");
    }).finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({ name, phone });
      await sellerApi.updateCompany({
        name: companyName,
        address: companyAddress,
        email: companyEmail,
        phone: companyPhone,
        description: companyDesc,
      });
      await refreshUser();
      toast("Profile saved successfully");
    } catch {
      toast("Could not save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast("Enter current and new password", "error");
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast("Could not change password. Check current password.", "error");
    }
  };

  if (loading) {
    return (
      <div>
        <SkeletonBox height={32} width={180} style={{ marginBottom: 24 }} />
        <div className="card"><SkeletonBox height={200} /></div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>Profile & Settings</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <form onSubmit={saveProfile} className="card">
          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Your Account</h3>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Email</span>
            <input value={user?.email || ""} disabled style={{ marginTop: 4, opacity: 0.7 }} />
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ fontSize: 13 }}>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginTop: 4 }} />
          </label>

          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Company</h3>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Company Name</span>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Description</span>
            <textarea value={companyDesc} onChange={(e) => setCompanyDesc(e.target.value)} rows={2} style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Address</span>
            <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Company Email</span>
            <input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ fontSize: 13 }}>Company Phone</span>
            <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <form onSubmit={changePassword} className="card">
          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Change Password</h3>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}>Current Password</span>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ fontSize: 13 }}>New Password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} style={{ marginTop: 4 }} />
          </label>
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
