// app/AfterAccepting.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router, Stack, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type AvailabilitySlot = { day?: string; start?: string; end?: string };
type VehicleCounts = Record<"Cars" | "Vans" | "Bikes" | "Buses" | string, number>;

type Space = {
  id: number;
  name: string;
  address: string;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  availability: AvailabilitySlot[];
  vehicle_counts: VehicleCounts;
  spaces_available: number;
  is_free: boolean;
  price_amount: number | null;
  price_unit: "hour" | "day" | null;
  pricing_text: string | null;
  open_text: string;
};

const BLUE = "#0099ff";

/** ===== API CONFIG (edit IP only) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const LIST_ENDPOINT = `${API_BASE}/list_space_details.php`;

/** ===== Promo images ===== */
const PROMOS = [
  { id: "1", uri: "https://images.unsplash.com/photo-1527010154944-f2241763d806?w=1400&q=60" },
  { id: "2", uri: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1400&q=60" },
  { id: "3", uri: "https://images.unsplash.com/photo-1533560904424-2fdf5f34c9a1?w=1400&q=60" },
];

/* ---------- helpers ---------- */
const toMoney = (s: Space) => {
  if (s.is_free) return "Free";
  if (s.pricing_text) return s.pricing_text;
  if (s.price_amount != null && s.price_unit) return `Rs ${s.price_amount} / ${s.price_unit}`;
  return "Paid Parking";
};

const normalizeDay = (d: string) => d.trim().toLowerCase();
const todayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

/** “Open today” if a slot exists for today (we don’t show times) */
const isOpenToday = (slots: AvailabilitySlot[]) => {
  const today = todayName();
  return (slots || []).some((s) => {
    const d = typeof s.day === "string" ? normalizeDay(s.day) : "";
    return d.startsWith(today.slice(0, 3)) || d === today;
  });
};

/** Robust available-slots: prefer spaces_available; else sum vehicle_counts */
const getAvailableSlots = (s: Space) => {
  const direct = Number(s.spaces_available ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  let sum = 0;
  const counts = s.vehicle_counts || {};
  for (const k of Object.keys(counts)) {
    const n = Number((counts as any)[k]);
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
};

export default function AfterAccepting() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const pageWidth = width - 32;
  const isTablet = Math.max(width, height) >= 900;
  const DRAWER_W = Math.min(width * 0.82, isTablet ? 420 : 330);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  // Carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollerRef = useRef<ScrollView>(null);

  // Drawer animation
  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) drawerX.setValue(-DRAWER_W);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAWER_W]);

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
    Animated.timing(drawerX, {
      toValue: -DRAWER_W,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  // Disable iOS swipe/back; block Android back
  useEffect(() => {
    navigation.setOptions?.({
      gestureEnabled: false,
      headerShown: false,
      headerBackVisible: false,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (drawerOpen) {
          closeDrawer();
          return true;
        }
        // Block leaving this screen
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [drawerOpen])
  );

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(LIST_ENDPOINT);
      const json = await res.json();
      if (!json?.success) throw new Error("Failed to load");

      const items: Space[] = (json.items ?? []).map((raw: any) => {
        const rawSlots =
          raw.spaces_available ??
          raw.available_slots ??
          raw.total_slots ??
          raw.capacity ??
          0;

        const counts: VehicleCounts = Object.fromEntries(
          Object.entries(raw.vehicle_counts ?? {}).map(([k, v]) => [k, Number(v) || 0])
        );

        const base: Space = {
          id: Number(raw.id),
          name: String(raw.name ?? ""),
          address: raw.address ?? "",
          location_label: raw.location_label ?? null,
          latitude: raw.latitude != null ? Number(raw.latitude) : null,
          longitude: raw.longitude != null ? Number(raw.longitude) : null,
          availability: Array.isArray(raw.availability) ? raw.availability : [],
          vehicle_counts: counts,
          spaces_available: Number(rawSlots) || 0,
          is_free: !!raw.is_free,
          price_amount: raw.price_amount != null ? Number(raw.price_amount) : null,
          price_unit: raw.price_unit ?? null,
          pricing_text: raw.pricing_text ?? null,
          open_text: raw.open_text ?? "",
        };

        if (!base.spaces_available) {
          base.spaces_available = getAvailableSlots(base);
        }
        return base;
      });

      setSpaces(items);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem("pm_owner_name");
      setOwnerName(name);
    })();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Stats for drawer
  const stats = useMemo(() => {
    const total = spaces.length;
    const free = spaces.filter((s) => s.is_free).length;
    const paid = total - free;
    return { total, free, paid };
  }, [spaces]);

  // Logout (no updates during unmount)
  const logout = async () => {
    drawerX.stopAnimation();
    setDrawerOpen(false);
    await AsyncStorage.multiRemove(["pm_owner_id", "pm_owner_name", "pm_last_space_id"]);
    requestAnimationFrame(() => {
      router.replace("/ChooseRole");
    });
  };

  /* ---------- Header ---------- */
  const Header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={openDrawer} style={styles.headerBtn} hitSlop={12}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>Approved Spaces</Text>
        <Text style={styles.headerTitle}>
          Welcome back, <Text style={{ fontWeight: "800" }}>{ownerName || "Owner"} 👋</Text>
        </Text>
      </View>

      <View style={styles.avatar}>
        <Ionicons name="person" size={18} color={BLUE} />
      </View>
    </View>
  );

  /* ---------- List header: promo only ---------- */
  const ListHeader = (
    <View style={styles.promoWrap}>
      <ScrollView
        ref={scrollerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveSlide(idx);
        }}
        scrollEventThrottle={16}
      >
        {PROMOS.map((p) => (
          <View key={p.id} style={{ width: width - 32 }}>
            <ImageBackground
              source={{ uri: p.uri }}
              style={styles.promoImage}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={styles.promoOverlay} />
              <View style={styles.promoTextBox}>
                <Text style={styles.promoTitle}>Grow your earnings</Text>
                <Text style={styles.promoSubtitle}>Keep spaces updated & attract more drivers</Text>
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {PROMOS.map((p, i) => (
          <View key={p.id} style={[styles.dot, activeSlide === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading spaces…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        {Header}
        <Text style={{ color: "#b91c1c", fontWeight: "600", marginTop: 20 }}>{error}</Text>
        <TouchableOpacity style={[styles.retryChip, { marginTop: 14 }]} onPress={load}>
          <Text style={styles.retryChipText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />
      {Header}

      <FlatList
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 90 }}
        data={spaces}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <SpaceCard
            space={item}
            onOpen={() =>
              router.push({
                pathname: "/ShowParkingSpaceDetails",
                params: { space: encodeURIComponent(JSON.stringify(item)) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={22} color="#6b7280" />
            <Text style={{ color: "#6b7280", marginLeft: 6 }}>No spaces found.</Text>
          </View>
        }
      />

      {/* Floating + button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => router.push("/RegisterSpace")}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Drawer */}
      {drawerOpen && <Pressable style={styles.backdrop} onPress={closeDrawer} />}
      <Animated.View style={[styles.drawer, { width: DRAWER_W, transform: [{ translateX: drawerX }] }]}>
        {/* Drawer Header Card */}
        <View style={styles.drawerTopCard}>
          <View style={styles.drawerAvatar}>
            <Ionicons name="person" size={18} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.drawerName}>{ownerName || "Owner"}</Text>
            <Text style={styles.drawerMuted}>Space Owner</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.cardRow}>
          <StatCard icon="layers-outline" label="Total" value={String(stats.total)} />
          <StatCard icon="pricetag-outline" label="Free" value={String(stats.free)} />
          <StatCard icon="card-outline" label="Paid" value={String(stats.paid)} />
        </View>

        {/* Menu Card */}
        <View style={styles.menuCard}>
          <MenuItem icon="home-outline" label="Home" onPress={closeDrawer} />
          <Divider />
          <MenuItem icon="information-circle-outline" label="About" onPress={() => { closeDrawer(); router.push("/About"); }} />
          <Divider />
          <MenuItem icon="call-outline" label="Contact Us" onPress={() => { closeDrawer(); router.push("/ContactUs"); }} />
          <Divider />
          <MenuItem icon="card-outline" label="Payment Info" onPress={() => { closeDrawer(); router.push("/PaymentInfo"); }} />
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

/* ========== Card ========== */
function SpaceCard({ space, onOpen }: { space: Space; onOpen?: () => void }) {
  const money = toMoney(space);
  const photo = "https://picsum.photos/seed/parking-illustration/900/500";
  const location = space.location_label || space.address || space.name;

  const openText = isOpenToday(space.availability) ? "Open today" : "Closed today";
  const totalSlots = getAvailableSlots(space);

  // Always show the 4 canonical categories with counts (0 included)
  const cats: Array<{ key: "Cars" | "Vans" | "Bikes" | "Buses"; label: string; icon: any; count: number }> = [
    { key: "Cars",  label: "Cars",  icon: "car-outline" as any,        count: Number(space.vehicle_counts?.Cars  ?? 0) },
    { key: "Vans",  label: "Vans",  icon: "car-sport-outline" as any,  count: Number(space.vehicle_counts?.Vans  ?? 0) },
    { key: "Bikes", label: "Bikes", icon: "bicycle-outline" as any,    count: Number(space.vehicle_counts?.Bikes ?? 0) },
    { key: "Buses", label: "Buses", icon: "bus-outline" as any,        count: Number(space.vehicle_counts?.Buses ?? 0) },
  ];

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onOpen} style={styles.cardWrap}>
      <View style={styles.card}>
        {/* Image + price badge */}
        <ImageBackground source={{ uri: photo }} style={styles.cardImage} imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
          <View style={styles.priceBadge}>
            <Ionicons name={space.is_free ? "gift-outline" : "cash-outline"} size={14} color="#fff" />
            <Text style={styles.priceBadgeText}>{money}</Text>
          </View>
        </ImageBackground>

        {/* Content */}
        <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 }}>
          {/* Title + total available */}
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>{space.name || "Parking Space"}</Text>
            <View style={[styles.slotPill, totalSlots > 0 ? styles.slotPillOk : styles.slotPillZero]}>
              <Ionicons name="car-outline" size={12} color={totalSlots > 0 ? "#065f46" : "#991b1b"} />
              <Text style={[styles.slotPillText, totalSlots > 0 ? styles.slotPillTextOk : styles.slotPillTextZero]}>
                {totalSlots} available
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color="#ef4444" />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>

          {/* Category breakdown: Cars/Vans/Bikes/Buses with counts */}
          <View style={styles.catRow}>
            {cats.map(({ key, label, icon, count }) => (
              <View key={key} style={[styles.catChip, count === 0 && styles.catChipZero]}>
                <Ionicons
                  name={icon}
                  size={12}
                  color={count === 0 ? "#9aa3af" : BLUE}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.catChipText, count === 0 && styles.catChipTextZero]}>
                  {label} {count}
                </Text>
              </View>
            ))}
          </View>

          {/* Open today / Closed today */}
          <View style={[styles.metaBadge, { marginTop: 10, alignSelf: "flex-start" }]}>
            <Ionicons name="time-outline" size={12} color="#111827" />
            <Text style={styles.metaBadgeText}>{openText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ========== Drawer mini components ========== */
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
function Divider() { return <View style={styles.divider} />; }

/* ========== Styles ========== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BLUE,
  },
  headerBtn: {
    height: 40, width: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  kicker: { color: "#e0f2ff", fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 18, color: "#ffffff" },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffffff",
    alignItems: "center", justifyContent: "center",
  },

  /* Promo */
  promoWrap: { marginTop: 14, marginHorizontal: 16, borderRadius: 16, overflow: "hidden" },
  promoImage: {
    height: 150, width: "100%", borderRadius: 16, overflow: "hidden",
    justifyContent: "flex-end",
  },
  promoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  promoTextBox: { padding: 12 },
  promoTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  promoSubtitle: { color: "#f1f5f9", fontSize: 12, marginTop: 4 },
  dots: { flexDirection: "row", alignSelf: "center", paddingVertical: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#e5e7eb" },
  dotActive: { backgroundColor: "#111827" },

  /* Retry chip */
  retryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: "#EAF2FF", borderWidth: 1, borderColor: "#d2e7ff",
  },
  retryChipText: { color: "#0f172a", fontWeight: "700" },

  /* Empty */
  empty: {
    flexDirection: "row", alignItems: "center",
    padding: 16, marginTop: 24, justifyContent: "center",
  },

  /* Card */
  cardWrap: { paddingHorizontal: 16, paddingTop: 14 },
  card: {
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  cardImage: { width: "100%", height: 150 },
  priceBadge: {
    position: "absolute", right: 10, top: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: "row", alignItems: "center",
  },
  priceBadgeText: { color: "#fff", fontWeight: "800", marginLeft: 6, fontSize: 12 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },

  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", flex: 1, paddingRight: 10 },

  slotPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  slotPillOk: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  slotPillZero: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  slotPillText: { fontWeight: "800", fontSize: 12 },
  slotPillTextOk: { color: "#065f46" },
  slotPillTextZero: { color: "#991b1b" },

  locationText: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },

  /* Category chips */
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  catChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderColor: "#cfe4ff", borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  catChipZero: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  catChipText: { color: "#0F172A", fontWeight: "700", fontSize: 12 },
  catChipTextZero: { color: "#9aa3af" },

  /* Open/Closed badge */
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F3F4F6", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  metaBadgeText: { color: "#111827", fontWeight: "600", fontSize: 12 },

  /* FAB */
  fab: {
    position: "absolute", right: 20, bottom: 24,
    backgroundColor: BLUE, width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },

  /* Drawer */
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  drawer: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    backgroundColor: "#f8fafc",
    paddingTop: 16, paddingHorizontal: 14,
    elevation: 20, shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },

  drawerTopCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  drawerAvatar: {
    height: 46, width: 46, borderRadius: 23,
    backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#e5e7eb", marginRight: 12,
  },
  drawerName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  drawerMuted: { fontSize: 12, color: "#64748b", marginTop: 2 },
  closeBtn: {
    height: 32, width: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9",
  },

  cardRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: "#ffffff",
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center",
  },
  statIcon: {
    height: 34, width: 34, borderRadius: 10,
    backgroundColor: "#e6f5ff",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1, borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 12,
  },
  menuIconWrap: {
    height: 36, width: 36, borderRadius: 12,
    backgroundColor: "#e6f5ff",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 60 },

  logoutCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1, borderColor: "#fee2e2",
    paddingVertical: 12, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center",
  },
  logoutIconWrap: {
    height: 36, width: 36, borderRadius: 12,
    backgroundColor: "#fff1f2",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  logoutText: { flex: 1, fontSize: 15, color: "#ef4444", fontWeight: "800" },
});
