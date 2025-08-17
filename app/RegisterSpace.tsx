// app/RegisterSpace.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const STEP = 1;
const TOTAL_STEPS = 2;
const PROGRESS = STEP / TOTAL_STEPS;

const palette = {
  primary: "#0099ff",
  primaryDark: "#007ddd",
  background: "#F5F6FA",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#6B7280",
  inputBg: "#F2F4F7",
  border: "#E5E7EB",
};

export default function RegisterSpace() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.max(width, height) >= 900;

  const contentMax = isTablet ? 720 : undefined;
  const imgSize = Math.min(Math.round(width * 0.28), isTablet ? 140 : 110);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const _fullName = fullName.trim();
    const _contact = contact.trim().replace(/\D/g, "");
    const _email = email.trim().toLowerCase();
    const _nic = nic.trim();
    const _address = address.trim();

    if (!_fullName || !_contact || !_email || !_nic || !_address) {
      Alert.alert("Missing details", "Please fill in all fields.");
      return;
    }
    if (_contact.length !== 10) {
      Alert.alert("Invalid phone", "Contact number must be exactly 10 digits.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_email);
    if (!emailOk) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        "http://192.168.8.131/ParkMate/save_SpaceOwner_details.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: _fullName,
            contact: _contact,
            email: _email,
            nic: _nic,
            address: _address,
          }),
        }
      );

      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      if (data?.success) {
        Alert.alert("Saved", "Owner details saved successfully.", [
          { text: "OK", onPress: () => router.push("/RegisterSapceDetails") },
        ]);
      } else {
        throw new Error(data?.message || "Failed to save owner details");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Network or server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={palette.primary} />

      {/* Compact App Bar */}
      <View style={[styles.appbar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.appbarBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={styles.appbarCenter}>
          <RNText style={styles.appbarTitle}>Owner details</RNText>
          <RNText style={styles.appbarSub}>We’ll use these for verification and contact.</RNText>
        </View>

        <View style={styles.stepPill}>
          <RNText style={styles.stepText}>Step {STEP}/{TOTAL_STEPS}</RNText>
        </View>
      </View>

      {/* Progress line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >
          {/* Content */}
          <View style={[styles.content, { maxWidth: contentMax, alignSelf: "center", width: "100%" }]}>
            <RNText style={styles.sectionTitle}>Owner Details</RNText>

            {/* Card with icon inputs */}
            <View style={styles.card}>
              <Field
                icon="person-outline"
                placeholder="Full Name (Landowner / Parking space provider)"
                value={fullName}
                onChangeText={setFullName}
              />
              <Field
                icon="call-outline"
                placeholder="Contact number"
                keyboardType="number-pad"
                value={contact}
                onChangeText={(v: string) => setContact(v.replace(/\D/g, ""))}
                maxLength={10}
              />
              <Field
                icon="mail-outline"
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Field
                icon="document-text-outline"
                placeholder="NIC / ID Number"
                value={nic}
                onChangeText={setNic}
              />
              <Field
                icon="home-outline"
                placeholder="Residential Address"
                value={address}
                onChangeText={setAddress}
                multiline
                height={84}
              />

              <View style={styles.helperRow}>
                <Ionicons name="information-circle-outline" size={16} color={palette.primary} />
                <RNText style={styles.helperText}>
                  Make sure your email and phone are active — admins may contact you.
                </RNText>
              </View>
            </View>

            {/* Decorative images */}
            <View style={styles.bottomImages}>
              <Image
                source={require("../assets/images/owner1.png")}
                style={[styles.icon, { width: imgSize, height: imgSize }]}
              />
              <Image
                source={require("../assets/images/car1.png")}
                style={[styles.icon, { width: imgSize, height: imgSize }]}
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, { bottom: insets.bottom + 18, left: 20, right: 20 }]}
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={saving}
        >
          <RNText style={styles.nextButtonText}>{saving ? "Saving..." : "Next"}</RNText>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Reusable field with left icon ---------- */
function Field({
  icon,
  height,
  ...rest
}: any & { icon: any; height?: number }) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={palette.textMuted} style={styles.leftIcon} />
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[styles.input, styles.inputWithIcon, height ? { height } : null]}
        {...rest}
      />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },

  /* Compact App Bar */
  appbar: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  appbarBtn: {
    height: 36, width: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  appbarCenter: { flex: 1, marginHorizontal: 10 },
  appbarTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  appbarSub: { color: "#EAF6FF", fontSize: 12, marginTop: 2 },
  stepPill: {
    paddingHorizontal: 10, height: 28, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  stepText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* Progress */
  progressTrack: { height: 3, backgroundColor: "#DCE9FF" },
  progressFill: { height: 3, backgroundColor: "#fff" },

  /* Content */
  content: { paddingHorizontal: 18, paddingTop: 14 },
  sectionTitle: {
    fontSize: 20, fontWeight: "800", color: palette.text,
    textAlign: "center", marginBottom: 14,
  },

  /* Card */
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  inputWrap: { position: "relative", marginBottom: 10 },
  leftIcon: { position: "absolute", left: 14, top: 16 },
  input: {
    backgroundColor: palette.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 52,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
  },
  inputWithIcon: { paddingLeft: 44 },

  helperRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  helperText: { marginLeft: 6, color: palette.textMuted, fontSize: 12, flex: 1 },

  bottomImages: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  icon: { resizeMode: "contain", backgroundColor: "#EAF2FF", borderRadius: 14 },

  nextButton: {
    position: "absolute",
    backgroundColor: palette.primaryDark,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    elevation: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  nextButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
