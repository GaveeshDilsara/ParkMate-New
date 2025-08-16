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

export default function RegisterDriver() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

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

      // (optional) store for later use, or just go to Login
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={{
                uri:
                  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
              }}
              style={styles.hero}
            >
              <LinearGradient
                colors={["transparent", "transparent", "rgba(255,255,255,0.96)", "#fff"]}
                style={styles.heroGradient}
              />
              <Text style={styles.heroTitle}>Register Here</Text>
            </ImageBackground>
          </View>

          <View style={styles.container}>
            {/* Username */}
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color="#8D99AE" />
              <TextInput
                style={styles.input}
                placeholder="User Name"
                placeholderTextColor="#9BA4B5"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#8D99AE" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9BA4B5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setSecure((s) => !s)} hitSlop={12}>
                <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#8D99AE" />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#8D99AE" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9BA4B5"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Contact Number */}
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color="#8D99AE" />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                placeholderTextColor="#9BA4B5"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
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
              <Text style={{ color: "#6B7280" }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/LogIn_Driver")}>
                <Text style={{ color: "#2F80ED", fontWeight: "600" }}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  heroWrap: { height: 260, overflow: "hidden" },
  hero: { flex: 1, justifyContent: "flex-end" },
  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "75%" },
  heroTitle: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  container: { paddingHorizontal: 24, marginTop: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
    marginTop: 14,
  },
  input: { flex: 1, paddingHorizontal: 10, color: "#111827" },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#2F80ED",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});
