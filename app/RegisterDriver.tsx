// app/RegisterDriver.tsx  (or keep your original filename/path)
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// 👇 change ONLY this line to your PC's LAN IP
const BASE_URL = "http://192.168.8.131/Parkmate";

/* THEME */
const BLUE = "#0099ff";
const BG = "#f6f7fb";
const SURFACE = "#ffffff";
const BORDER = "#e6e9f2";
const TEXT = "#0f172a";
const MUTED = "#6b7280";

export default function RegisterDriver() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // focus states for subtle glow
  const [fName, setFName] = useState(false);
  const [fPass, setFPass] = useState(false);
  const [fEmail, setFEmail] = useState(false);
  const [fPhone, setFPhone] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }
    if (!/^[0-9+\-\s()]{7,}$/.test(phone)) {
      Alert.alert("Invalid phone", "Enter a valid contact number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/save_driver_details.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, phone }),
      });
      const json = await res.json();

      if (!json?.success) {
        setLoading(false);
        Alert.alert("Sign up failed", json?.message || "Please try again.");
        return;
      }

      await AsyncStorage.setItem("pm_driver_last", JSON.stringify(json.driver));
      setLoading(false);
      Alert.alert("Success", "Account created. Please log in.");
      router.replace("/LogIn_Driver");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Network error", e?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding" })}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* HERO */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={{
                uri:
                  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
              }}
              style={styles.hero}
              imageStyle={{ opacity: 0.95 }}
            >
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.85)", "#fff"]}
                style={styles.heroGradient}
              />
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>Create your account</Text>
                <Text style={styles.title}>Register as Driver</Text>
                <Text style={styles.subtitle}>
                  Find and book the right parking spot in seconds.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* CARD */}
          <View style={styles.content}>
            <View style={styles.card}>

              {/* Username */}
              <View style={[styles.inputWrap, fName && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="person-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="User Name"
                  placeholderTextColor="#98a2b3"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onFocus={() => setFName(true)}
                  onBlur={() => setFName(false)}
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
                  returnKeyType="next"
                  onFocus={() => setFPass(true)}
                  onBlur={() => setFPass(false)}
                />
                <TouchableOpacity onPress={() => setSecure((s) => !s)} hitSlop={12} style={styles.trailingIcon}>
                  <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Email */}
              <View style={[styles.inputWrap, fEmail && styles.inputFocused]}>
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
                  returnKeyType="next"
                  onFocus={() => setFEmail(true)}
                  onBlur={() => setFEmail(false)}
                />
              </View>

              {/* Phone */}
              <View style={[styles.inputWrap, fPhone && styles.inputFocused]}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="call-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Contact Number"
                  placeholderTextColor="#98a2b3"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onFocus={() => setFPhone(true)}
                  onBlur={() => setFPhone(false)}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign up</Text>}
              </TouchableOpacity>

              {/* Switch to login */}
              <View style={styles.bottomRow}>
                <Text style={{ color: MUTED }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/LogIn_Driver")}>
                  <Text style={{ color: BLUE, fontWeight: "800" }}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tiny tip */}
            <View style={styles.tips}>
              <Ionicons name="information-circle-outline" size={16} color={MUTED} />
              <Text style={styles.tipsText}>Use a valid email and mobile for password recovery.</Text>
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
  heroTextWrap: { position: "absolute", bottom: 18, left: 20, right: 20 },
  kicker: { color: "#1f2937", fontSize: 12, marginBottom: 4 },
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

  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },

  tips: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  tipsText: { marginLeft: 6, color: MUTED, fontSize: 12 },
});
