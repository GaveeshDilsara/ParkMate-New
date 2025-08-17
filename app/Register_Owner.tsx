// app/RegisterOwner.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** API */
const BASE_URL = "http://192.168.8.131";
const SAVE_URL = `${BASE_URL}/ParkMate/save_owner_details.php`;

/** THEME */
const BLUE = "#0099ff";
const BG = "#f6f7fb";
const SURFACE = "#ffffff";
const BORDER = "#e6e9f2";
const TEXT = "#0f172a";
const MUTED = "#6b7280";

export default function RegisterOwner() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // focus glow
  const [fUser, setFUser] = useState(false);
  const [fPass, setFPass] = useState(false);
  const [fMail, setFMail] = useState(false);
  const [fPhone, setFPhone] = useState(false);

  const handleRegister = async () => {
    const u = username.trim();
    const p = password.trim();
    const e = email.trim();
    const ph = phone.trim();

    if (!u || !p || !e || !ph) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }
    if (!/^[0-9+\-\s()]{7,}$/.test(ph)) {
      Alert.alert("Invalid phone", "Enter a valid contact number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p, email: e, phone: ph }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Registration failed");
      }

      Alert.alert("Success", "Registered successfully!");
      // adjust this path if your login screen is named differently
      router.replace("/LogIn_Owner");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 }}>
          {/* HERO */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={require("../assets/images/parking-car.jpg")}
              style={styles.hero}
              imageStyle={{ resizeMode: "cover" }}
            >
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.9)", "#fff"]}
                style={styles.heroGradient}
              />
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>Create your account</Text>
                <Text style={styles.title}>Register as Owner</Text>
                <Text style={styles.subtitle}>List your parking spaces in minutes.</Text>
              </View>
            </ImageBackground>
          </View>

          {/* FORM CARD */}
          <View style={styles.content}>
            <View style={styles.card}>
              {/* Username */}
              <View style={[styles.inputWrap, fUser && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="person-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="User Name / Phone no"
                  placeholderTextColor="#98a2b3"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setFUser(true)}
                  onBlur={() => setFUser(false)}
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrap, fPass && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#98a2b3"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                  onFocus={() => setFPass(true)}
                  onBlur={() => setFPass(false)}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setSecure(s => !s)} hitSlop={12} style={styles.trailingIcon}>
                  <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Email */}
              <View style={[styles.inputWrap, fMail && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="mail-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#98a2b3"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFMail(true)}
                  onBlur={() => setFMail(false)}
                  returnKeyType="next"
                />
              </View>

              {/* Phone */}
              <View style={[styles.inputWrap, fPhone && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="call-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor="#98a2b3"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setFPhone(true)}
                  onBlur={() => setFPhone(false)}
                  returnKeyType="done"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign up</Text>}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>Or continue with</Text>
                <View style={styles.line} />
              </View>

              {/* Google */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.googleText}>Google</Text>
              </TouchableOpacity>

              {/* Switch to login */}
              <View style={styles.bottomRow}>
                <Text style={{ color: MUTED }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/LogIn_Owner")}>
                  <Text style={{ color: BLUE, fontWeight: "800" }}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tip */}
            <View style={styles.tips}>
              <Ionicons name="shield-checkmark-outline" size={16} color={MUTED} />
              <Text style={styles.tipsText}>Your details are encrypted and securely stored.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* HERO */
  heroWrap: { height: 240, backgroundColor: "#000" },
  hero: { flex: 1, justifyContent: "flex-end" },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "72%" },
  heroTextWrap: { position: "absolute", bottom: 18, left: 20, right: 20, alignItems: "flex-start" },
  kicker: { color: "#1f2937", fontSize: 12, marginBottom: 4, fontWeight: "800" },
  title: { color: TEXT, fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#475569", fontSize: 12, marginTop: 4 },

  /* CONTENT */
  content: { paddingHorizontal: 16, marginTop: -28 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingLeft: 12,
    paddingRight: 12,
    height: 50,
    marginTop: 12,
  },
  inputFocused: {
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  leadingIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#e6f5ff",
    alignItems: "center", justifyContent: "center",
  },
  trailingIcon: { paddingLeft: 8 },
  input: { flex: 1, paddingHorizontal: 10, color: TEXT },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: BLUE,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  orRow: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 12 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  orText: { marginHorizontal: 10, color: "#6b7280", fontSize: 12 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  googleText: { fontSize: 14, color: "#0f172a", fontWeight: "700", marginLeft: 8 },

  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },

  tips: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  tipsText: { marginLeft: 6, color: MUTED, fontSize: 12 },
});
