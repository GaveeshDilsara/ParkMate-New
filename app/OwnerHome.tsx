// app/OwnerHome.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const BLUE = "#0099ff";

export default function OwnerHome() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.max(width, height) >= 900;
  const DRAWER_W = Math.min(width * 0.82, isTablet ? 420 : 330);
  const BANNER_H = Math.max(140, Math.min(260, height * 0.25));

  const banners = [
    require("../assets/images/banner1.png"),
    require("../assets/images/banner1.png"),
    require("../assets/images/banner1.png"),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  // Drawer animation (width-aware)
  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // keep drawer off-screen when width changes and drawer is closed
    if (!drawerOpen) drawerX.setValue(-DRAWER_W);
  }, [DRAWER_W, drawerOpen, drawerX]);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerX, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    Animated.timing(drawerX, {
      toValue: -DRAWER_W,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Block back navigation (only logout can leave this screen)
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (drawerOpen) {
          closeDrawer();
          return true;
        }
        return true; // block leaving OwnerHome
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [drawerOpen])
  );

  // Load owner name if saved
  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem("pm_owner_name");
      setOwnerName(name);
    })();
  }, []);

  // Banner auto-advance
  const scrollRef = useRef<ScrollView>(null);
  const bannerTimerRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current as any);
      bannerTimerRef.current = null;
    }
    const id = setInterval(() => {
      const next = (currentIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    }, 3500);
    bannerTimerRef.current = id as any;

    return () => {
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current as any);
        bannerTimerRef.current = null;
      }
    };
  }, [currentIndex, width]);

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== currentIndex) setCurrentIndex(i);
  };

  // Navigation helpers
  const goRegister = () => router.push("/RegisterSpace");
  const goRoute = (path: string) => {
    closeDrawer();
    if (path !== "/") router.push(path as any);
  };
  const logout = async () => {
    drawerX.stopAnimation();
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current as any);
      bannerTimerRef.current = null;
    }
    setDrawerOpen(false);
    await AsyncStorage.multiRemove(["pm_owner_id", "pm_owner_name"]);
    requestAnimationFrame(() => router.replace("/ChooseRole"));
  };

  // optional max width on large screens
  const contentMax = isTablet ? 720 : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="menu" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Owner Dashboard</Text>
          <Text style={styles.headerTitle}>
            Welcome back, <Text style={styles.bold}>{ownerName || "User"} 👋</Text>
          </Text>
        </View>

        <Image source={require("../assets/images/avatar.png")} style={styles.avatar} />
      </View>

      {/* Banner */}
      <View style={styles.bannerWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {banners.map((img, idx) => (
            <ImageBackground
              key={idx}
              source={img}
              style={{ width, height: BANNER_H, justifyContent: "flex-end" }}
              imageStyle={styles.bannerImg}
            >
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerTextBox}>
                <Text style={styles.bannerTitle}>Manage your spaces</Text>
                <Text style={styles.bannerSubtitle}>Track availability & earnings</Text>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Empty state card */}
      <View style={[styles.content, { maxWidth: contentMax, alignSelf: "center", width: "100%" }]}>
        <View style={styles.emptyCard}>
          <Ionicons name="business-outline" size={28} color={BLUE} />
          <Text style={styles.cardTitle}>No spaces yet</Text>
          <Text style={styles.cardSubtitle}>
            Tap the plus button to register your first parking space.
          </Text>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={goRegister} activeOpacity={0.9}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Drawer */}
      {drawerOpen && <Pressable style={styles.backdrop} onPress={closeDrawer} />}
      <Animated.View
        style={[
          styles.drawer,
          { width: DRAWER_W, transform: [{ translateX: drawerX }] },
        ]}
      >
        {/* Drawer Header Card */}
        <View style={styles.drawerTopCard}>
          <Image source={require("../assets/images/avatar.png")} style={styles.drawerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.drawerName}>{ownerName || "User"}</Text>
            <Text style={styles.drawerMuted}>Space Owner</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.cardRow}>
          <StatCard icon="car-outline" label="Total Spaces" value="0" />
          <StatCard icon="time-outline" label="Pending" value="0" />
        </View>

        {/* Menu Card */}
        <View style={styles.menuCard}>
          <MenuItem icon="home-outline" label="Home" onPress={() => goRoute("/")} />
          <Divider />
          <MenuItem icon="information-circle-outline" label="About" onPress={() => goRoute("/About")} />
          <Divider />
          <MenuItem icon="call-outline" label="Contact Us" onPress={() => goRoute("/ContactUs")} />
          <Divider />
          <MenuItem icon="card-outline" label="Payment Info" onPress={() => goRoute("/PaymentInfo")} />
        </View>

        {/* Logout Card */}
        <TouchableOpacity style={styles.logoutCard} onPress={logout} activeOpacity={0.9}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
          <Ionicons name="chevron-forward" size={18} color="#ef4444" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ---------- Small components ---------- */
function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={BLUE} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={BLUE} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BLUE,
  },
  headerBtn: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  kicker: { color: "#e0f2ff", fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 18, color: "#ffffff" },
  bold: { fontWeight: "800" },
  avatar: { width: 36, height: 36, borderRadius: 18, marginLeft: 10, backgroundColor: "#fff" },

  bannerWrap: { backgroundColor: "#ffffff" },
  bannerImg: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerTextBox: { padding: 16 },
  bannerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800" },
  bannerSubtitle: { color: "#f1f5f9", fontSize: 12, marginTop: 4 },
  dots: {
    position: "absolute",
    bottom: 8,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: "#ffffff" },

  content: { padding: 16 },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cardTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 10 },
  cardSubtitle: { color: "#475569", fontSize: 13, textAlign: "center", marginTop: 6 },

  fab: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#f8fafc",
    paddingTop: 16,
    paddingHorizontal: 14,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  /* Drawer cards */
  drawerTopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  drawerAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, backgroundColor: "#f1f5f9" },
  drawerName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  drawerMuted: { fontSize: 12, color: "#64748b", marginTop: 2 },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },

  cardRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statIcon: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: "#e6f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuIconWrap: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "#e6f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 60 },

  logoutCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIconWrap: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "#fff1f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutText: { flex: 1, fontSize: 15, color: "#ef4444", fontWeight: "800" },
});
