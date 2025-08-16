import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const palette = {
  primary: "#0EA5E9",
  primaryDark: "#0284C7",
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

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const imgSize = Math.min(Math.round(width * 0.28), 110);

  const handleSubmit = async () => {
    // (Light) validation – feel free to adjust
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

      // 🔁 CHANGE the IP/host to your XAMPP machine (or use ngrok/cloudflared URL)
// inside handleSubmit
const res = await fetch("http://192.168.8.131/ParkMate/save_SpaceOwner_details.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: _fullName,
    contact: _contact,
    email: _email,
    nic: _nic,
    address: _address,
  }),
});


      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

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
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={palette.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        >
          {/* Header */}
          <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </TouchableOpacity>

              <View style={styles.titleWrap}>
                <RNText style={styles.title} numberOfLines={2}>
                  {"Got a spot?\nLet drivers find it"}
                </RNText>
              </View>

              <View style={styles.toolBtn} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <RNText style={styles.sectionTitle}>Owner Details</RNText>

            <View style={styles.card}>
              <TextInput
                placeholder="Full Name (Landowner / Parking space provider)"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                placeholder="Contact number"
                placeholderTextColor={palette.textMuted}
                keyboardType="number-pad"
                style={styles.input}
                value={contact}
                onChangeText={(v) => setContact(v.replace(/\D/g, ""))}
                maxLength={10}
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={palette.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                placeholder="NIC / ID Number"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={nic}
                onChangeText={setNic}
              />
              <TextInput
                placeholder="Residential Address"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, { height: 72 }]}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

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
          style={[styles.nextButton, { bottom: insets.bottom + 18 }]}
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={saving}
        >
          <RNText style={styles.nextButtonText}>{saving ? "Saving..." : "Next"}</RNText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  headerWrapper: {
    backgroundColor: palette.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  titleWrap: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 20,
  },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.text,
    textAlign: "center",
    marginBottom: 18,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  input: {
    backgroundColor: palette.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 52,
    marginBottom: 10,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bottomImages: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  icon: { resizeMode: "contain", backgroundColor: "#EAF2FF", borderRadius: 14 },
  nextButton: {
    position: "absolute",
    right: 20,
    alignSelf: "center",
    backgroundColor: palette.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
