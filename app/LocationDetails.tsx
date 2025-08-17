// app/LocationDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// 👇 same backend base as DriverHome
const BASE_URL = "http://192.168.8.131/Parkmate";
const SPACES_ENDPOINT = `${BASE_URL}/list_spaces_near.php`;

type Counts = Record<string, number>;

type Space = {
  id: number;
  name: string;
  address: string;
  location_label: string | null;
  latitude: number;
  longitude: number;
  is_free: boolean;
  price_amount: number | null;
  price_unit: "hour" | "day" | null;
  pricing_text: string | null;
  distance_m?: number | null;
  availability?: { day?: string; start?: string; end?: string }[];
  vehicle_counts?: Counts;        // capacity
  occupied_counts?: Counts;       // live
  available_counts?: Counts;      // live
};

const BANNERS = [
  { id: "1", uri: "https://images.unsplash.com/photo-1518306727298-4c17e1bf0681?q=80&w=1200&auto=format&fit=crop" },
  { id: "2", uri: "https://images.unsplash.com/photo-1484312152213-d713e8b7c053?q=80&w=1200&auto=format&fit=crop" },
  { id: "3", uri: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1200&auto=format&fit=crop" },
];

// Which vehicle keys to show per space (order + icon)
const VEH_KEYS: Array<{ key: "Cars" | "Buses" | "Bikes" | "Vans"; label: string; icon: any }> = [
  { key: "Cars", label: "Car",  icon: "car-outline" },
  { key: "Vans", label: "Van",  icon: "car-sport-outline" },
  { key: "Bikes", label: "Bike", icon: "bicycle-outline" },
  { key: "Buses", label: "Bus",  icon: "bus-outline" },
];

const REFRESH_MS = 5000;
const BLUE = "#3B82F6";
const BG = "#F3F4F6";
const CARD = "#ffffff";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#6B7280";

export default function LocationDetails() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; radius?: string }>();
  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;
  const radius = params.radius ? parseFloat(params.radius) : 5000;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollView | null>(null);

  const fetchSpaces = async () => {
    try {
      const url = `${SPACES_ENDPOINT}?lat=${encodeURIComponent(lat ?? 0)}&lng=${encodeURIComponent(
        lng ?? 0
      )}&radius=${encodeURIComponent(radius)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to load spaces");

      const items: Space[] = (json.items || []).map((s: any) => ({
        id: Number(s.id),
        name: String(s.name),
        address: s.address ?? "",
        location_label: s.location_label ?? null,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        is_free: !!s.is_free,
        price_amount: s.price_amount != null ? Number(s.price_amount) : null,
        price_unit: s.price_unit ?? null,
        pricing_text: s.pricing_text ?? null,
        distance_m: s.distance_m != null ? Number(s.distance_m) : null,
        availability: Array.isArray(s.availability) ? s.availability : [],
        vehicle_counts: s.vehicle_counts ?? {},
        occupied_counts: s.occupied_counts ?? {},
        available_counts: s.available_counts ?? {},
      }));

      setSpaces(items);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not load spaces.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // initial + polling
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchSpaces();
    })();

    const t = setInterval(() => {
      if (mounted) fetchSpaces();
    }, REFRESH_MS);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [lat, lng, radius]);

  // sort by distance (nearest first)
  const sorted = useMemo(() => {
    const clone = [...spaces];
    clone.sort((a, b) => {
      const ad = a.distance_m ?? Infinity;
      const bd = b.distance_m ?? Infinity;
      return ad - bd;
    });
    return clone;
  }, [spaces]);

  // ---- time + open helpers ----
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayShort = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  function normDay(d?: string) {
    if (!d) return null;
    const t = d.trim();
    const iLong = dayNames.findIndex((n) => n.toLowerCase() === t.toLowerCase());
    if (iLong >= 0) return iLong;
    const iShort = dayShort.findIndex((n) => n.toLowerCase() === t.toLowerCase());
    if (iShort >= 0) return iShort;
    return null;
  }
  function to12h(hhmm: string) {
    const [H, M] = hhmm.split(":").map((x) => parseInt(x, 10));
    const am = H < 12;
    const hr = ((H + 11) % 12) + 1;
    return `${hr}:${String(M).padStart(2, "0")} ${am ? "AM" : "PM"}`;
  }
  function hhmmToMinutes(s?: string | null): number | null {
    if (!s) return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    return h * 60 + min;
  }
  function todayWindow(s: Space): { start?: number; end?: number } | null {
    const arr = Array.isArray(s.availability) ? s.availability : [];
    let start: number | undefined;
    let end: number | undefined;
    let foundForToday = false;

    for (const a of arr) {
      const di = normDay(a?.day);
      const st = hhmmToMinutes(a?.start ?? null);
      const en = hhmmToMinutes(a?.end ?? null);

      if (di === todayIdx && st != null && en != null) {
        foundForToday = true;
        start = start == null ? st : Math.min(start, st);
        end = end == null ? en : Math.max(end, en);
      }
    }

    // if no explicit day, fallback to min/max of all as “daily”
    if (!foundForToday && arr.length) {
      let minAll = Infinity, maxAll = -Infinity, any = false;
      for (const a of arr) {
        const st = hhmmToMinutes(a?.start ?? null);
        const en = hhmmToMinutes(a?.end ?? null);
        if (st != null && en != null) {
          any = true;
          if (st < minAll) minAll = st;
          if (en > maxAll) maxAll = en;
        }
      }
      if (any) return { start: minAll, end: maxAll };
    }

    if (start != null && end != null) return { start, end };
    return null;
  }
  function openInfo(s: Space) {
    const tw = todayWindow(s);
    if (!tw) return { openNow: false, label: "Hours vary" };
    const openNow = nowMins >= (tw.start ?? 0) && nowMins <= (tw.end ?? 0);
    const range = `${to12h(
      `${String(Math.floor((tw.start ?? 0) / 60)).padStart(2, "0")}:${String((tw.start ?? 0) % 60).padStart(2, "0")}`
    )} – ${to12h(
      `${String(Math.floor((tw.end ?? 0) / 60)).padStart(2, "0")}:${String((tw.end ?? 0) % 60).padStart(2, "0")}`
    )}`;
    return { openNow, label: openNow ? `Open now · ${range}` : `Closed now · ${range}` };
  }

  const distanceText = (m?: number | null) =>
    typeof m === "number" ? `${(m / 1000).toFixed(2)} km away` : "";

  const totalAvailable = (c?: Counts) =>
    (c?.Cars ?? 0) + (c?.Buses ?? 0) + (c?.Bikes ?? 0) + (c?.Vans ?? 0);

  const VehicleChip = ({ icon, label, count }: { icon: any; label: string; count: number }) => {
    const active = count > 0;
    return (
      <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
        <Ionicons name={icon as any} size={16} color={active ? "#fff" : "#6B7280"} />
        <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {count}
          </Text>
        </View>
      </View>
    );
  };

  const renderCard = ({ item }: { item: Space }) => {
    const avail = item.available_counts || {};
    const { openNow, label } = openInfo(item);

    const priceLabel = item.is_free
      ? "Free"
      : item.pricing_text ||
        (item.price_amount != null && item.price_unit
          ? `Rs ${item.price_amount} / ${item.price_unit}`
          : "Paid");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/Directions",
            params: {
              lat: String(item.latitude),
              lng: String(item.longitude),
              name: item.name || item.location_label || item.address || "Destination",
              distance: item.distance_m != null ? String(item.distance_m) : "",
            },
          })
        }
        style={styles.card}
      >
        {/* Header row */}
        <View style={styles.cardTop}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name="location-outline" size={18} color="#EF4444" />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || item.location_label || item.address}
            </Text>
          </View>

          {!!item.distance_m && (
            <View style={styles.pillSoft}>
              <Ionicons name="navigate-outline" size={14} color={TEXT} />
              <Text style={styles.pillSoftText}>{distanceText(item.distance_m)}</Text>
            </View>
          )}
        </View>

        {/* Meta row: price + open/closed */}
        <View style={styles.metaRow}>
          <View style={[styles.pricePill, item.is_free ? styles.freeBg : styles.paidBg]}>
            <Ionicons name={item.is_free ? "gift-outline" : "cash-outline"} size={14} color="#fff" />
            <Text style={styles.pricePillText}>{priceLabel}</Text>
          </View>

          <View style={[styles.openPill, openNow ? styles.openNowBg : styles.closedBg]}>
  <View style={[styles.statusDot, { backgroundColor: openNow ? "#22C55E" : "#EF4444" }]} />
  <Text style={styles.openPillText}>{label}</Text>
</View>

        </View>

        {/* Vehicle chips: live available per category */}
        <View style={styles.chipsRow}>
          {VEH_KEYS.map(({ key, label, icon }) => (
            <VehicleChip key={key} icon={icon} label={label} count={avail[key] ?? 0} />
          ))}
        </View>

        {/* Totals */}
        <View style={styles.line}>
          <Ionicons name="albums-outline" size={18} color="#3B82F6" />
          <Text style={styles.lineLabel}>Spaces Available:</Text>
          <Text style={styles.lineValue}>{totalAvailable(avail)}</Text>
        </View>

        {/* Thumbnail */}
        <Image
          source={{
            uri:
              "https://images.unsplash.com/photo-1486136600666-1d268ac63b22?q=80&w=1200&auto=format&fit=crop",
          }}
          style={styles.thumb}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#3B82F6", "#60A5FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Parking</Text>
          <View style={[styles.headerBtn, { opacity: 0.6 }]}>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.headerChips}>
          <View style={styles.headChip}>
            <View style={styles.liveDot} />
            <Text style={styles.headChipText}>Live</Text>
          </View>
          <View style={styles.headChip}>
            <Ionicons name="locate-outline" size={14} color="#fff" />
            <Text style={styles.headChipText}>{(radius / 1000).toFixed(0)} km radius</Text>
          </View>
          <View style={styles.headChip}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.headChipText}>{new Date().toLocaleTimeString()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: MUTED }}>Loading spaces…</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 22 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpaces(); }} />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: "center" }}>
              <Ionicons name="map-outline" size={28} color={MUTED} />
              <Text style={{ color: MUTED, marginTop: 6, textAlign: "center" }}>
                No spaces found nearby. Try increasing the radius or zooming out.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  headerChips: { flexDirection: "row", gap: 8, marginTop: 10 },
  headChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)",
  },
  headChipText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },

  // Banner
  bannerWrap: { width, height: 160, marginBottom: 8, backgroundColor: "#fff" },
  dots: { position: "absolute", bottom: 10, width, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D1D5DB" },
  dotActive: { backgroundColor: "#111827" },

  // Cards
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: { flex: 1, marginLeft: 6, marginRight: 6, color: TEXT, fontSize: 16, fontWeight: "800" },

  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },

  pillSoft: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  pillSoftText: { color: TEXT, fontWeight: "700", fontSize: 12 },

  pricePill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
  },
  freeBg: { backgroundColor: "#10B981" },
  paidBg: { backgroundColor: "#111827" },
  pricePillText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  openPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
  },
  openNowBg: { backgroundColor: "rgba(34,197,94,0.12)" },
  closedBg: { backgroundColor: "rgba(239,68,68,0.12)" },
  openPillText: { color: TEXT, fontWeight: "700", fontSize: 12 },

  statusDot: { width: 8, height: 8, borderRadius: 4 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 6 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, height: 32, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipInactive: { backgroundColor: "#F3F4F6", borderColor: BORDER },
  chipText: { marginLeft: 6, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: MUTED },

  badge: { marginLeft: 8, minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badgeActive: { backgroundColor: BLUE },
  badgeInactive: { backgroundColor: "#E5E7EB" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  badgeTextActive: { color: "#fff" },
  badgeTextInactive: { color: MUTED },

  line: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  lineLabel: { color: TEXT, fontSize: 14 },
  lineValue: { color: TEXT, fontWeight: "800" },

  thumb: { width: "100%", height: 120, borderRadius: 12, marginTop: 10, backgroundColor: "#E5E7EB" },

  // Bottom back
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 8, paddingLeft: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
    marginLeft: 4,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
