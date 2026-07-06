import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { authApi } from "../api";
import { SkeletonBox } from "../components/Skeleton";

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(!user);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savedAddress, setSavedAddress] = useState(user?.saved_address || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setSavedAddress(user.saved_address || "");
      setLoading(false);
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ name, phone, saved_address: savedAddress });
      await refreshUser();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Enter current and new password.");
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Alert.alert("Success", "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      Alert.alert("Error", "Could not change password. Check your current password.");
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <SkeletonBox height={200} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Your Account</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.disabled]} value={user?.email} editable={false} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>Saved Address</Text>
        <TextInput style={styles.input} value={savedAddress} onChangeText={setSavedAddress} placeholder="For faster checkout" placeholderTextColor={colors.mutedBlue} />
        <TouchableOpacity style={styles.button} onPress={saveProfile} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Profile"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TouchableOpacity style={styles.buttonSecondary} onPress={changePassword}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.deepNavy, marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: colors.deepNavy, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 12, fontSize: 16 },
  disabled: { opacity: 0.6, backgroundColor: colors.warmBeige },
  button: { backgroundColor: colors.deepNavy, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  buttonSecondary: { backgroundColor: colors.softRoyalBlue, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  buttonText: { color: colors.white, fontWeight: "600" },
  logoutBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 40 },
  logoutText: { color: colors.danger, fontWeight: "600" },
});
