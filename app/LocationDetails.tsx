// app/LocationDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
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
  vehicle_counts?: Record<string, number>; // expects keys like Cars, Buses, Bikes (Vans optional)
};

const BANNERS = [
  { id: "1", uri: "https://images.unsplash.com/photo-1518306727298-4c17e1bf0681?q=80&w=1200&auto=format&fit=crop" },
  { id: "2", uri: "https://images.unsplash.com/photo-1484312152213-d713e8b7c053?q=80&w=1200&auto=format&fit=crop" },
  { id: "3", uri: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1200&auto=format&fit=crop" },
];

// Which vehicle keys to show per space (order + icon)
const VEH_KEYS: Array<{ key: "Cars" | "Buses" | "Bikes"; label: string; icon: any }> = [
  { key: "Cars", label: "Car", icon: "car-outline" },
  { key: "Buses", label: "Bus", icon: "bus-outline" },
  { key: "Bikes", label: "Bike", icon: "bicycle-outline" },
];

export default function LocationDetails() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; radius?: string }>();
  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;
  const radius = params.radius ? parseFloat(params.radius) : 5000; // fallback 5km

  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Banner carousel state
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
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
          vehicle_counts: typeof s.vehicle_counts === "object" && s.vehicle_counts ? s.vehicle_counts : {},
        }));

        if (mounted) setSpaces(items);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Could not load spaces.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
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

  // ======= time helpers (TypeScript-safe) =======
  function hhmmToMinutes(s?: string | null): number | null {
    if (!s) return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    return h * 60 + min;
  }
  function minutesTo12h(mins: number): string {
    const H = Math.floor(mins / 60);
    const M = mins % 60;
    const hh = String(H).padStart(2, "0");
    const mm = String(M).padStart(2, "0");
    return to12h(`${hh}:${mm}`);
  }
  function openRangeText(s: Space) {
    const arr = Array.isArray(s.availability) ? s.availability : [];
    let min = Infinity;
    let max = -Infinity;
    for (const a of arr) {
      const st = hhmmToMinutes(a?.start ?? null);
      const en = hhmmToMinutes(a?.end ?? null);
      if (st !== null && st < min) min = st;
      if (en !== null && en > max) max = en;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "Open: See schedule";
    return `Open: ${minutesTo12h(min)} – ${minutesTo12h(max)}`;
  }
  function to12h(t: string) {
    const [H, M] = t.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(H) || Number.isNaN(M)) return t;
    const am = H < 12;
    const hr = ((H + 11) % 12) + 1;
    return `${hr}:${String(M).padStart(2, "0")} ${am ? "AM" : "PM"}`;
  }

  const distanceText = (m?: number | null) =>
    typeof m === "number" ? `${(m / 1000).toFixed(2)} km away` : "";

  const totalAllVehicles = (vc?: Record<string, number>) =>
    (vc?.Cars ?? 0) + (vc?.Buses ?? 0) + (vc?.Bikes ?? 0) + (vc?.Vans ?? 0);

  // a single vehicle chip
  const VehicleChip = ({ icon, label, count }: { icon: any; label: string; count: number }) => {
    const active = count > 0;
    return (
      <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
        <Ionicons name={icon as any} size={16} color={active ? "#fff" : "#6B7280"} />
        <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
          {label}
        </Text>
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {count}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.welcome}>
          Welcome Back,<Text style={{ fontWeight: "800" }}> User</Text> <Text>👋</Text>
        </Text>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={26} color="#111827" />
        </View>
      </View>

      {/* Banner carousel */}
      <View style={styles.bannerWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={bannerRef}
          onScroll={(e) => {
            const ix = Math.round(e.nativeEvent.contentOffset.x / width);
            if (ix !== bannerIndex) setBannerIndex(ix);
          }}
          scrollEventThrottle={16}
        >
          {BANNERS.map((b) => (
            <Image key={b.id} source={{ uri: b.uri }} style={{ width, height: 140 }} resizeMode="cover" />
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {BANNERS.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* List of spaces */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading spaces…</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 22 }}
          renderItem={({ item }) => {
            const vc = item.vehicle_counts || {};
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
                {/* Title row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Ionicons name="location-outline" size={18} color="#EF4444" />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name || item.location_label || item.address}
                  </Text>
                  {!!item.distance_m && <Text style={styles.distance}>{distanceText(item.distance_m)}</Text>}
                </View>

                {/* Vehicle chips (per space) */}
                <View style={styles.chipsRow}>
                  {VEH_KEYS.map(({ key, label, icon }) => (
                    <VehicleChip key={key} icon={icon} label={label} count={vc[key] ?? 0} />
                  ))}
                  {"Vans" in vc && (
                    <VehicleChip icon="car-sport-outline" label="Van" count={vc["Vans"] ?? 0} />
                  )}
                </View>

                {/* Summary lines */}
                <View style={styles.line}>
                  <Ionicons name="albums-outline" size={18} color="#3B82F6" />
                  <Text style={styles.lineLabel}>Spaces Available:</Text>
                  <Text style={styles.lineValue}>{totalAllVehicles(vc)}</Text>
                </View>

                <View style={styles.line}>
                  <Ionicons name="cash-outline" size={18} color="#10B981" />
                  <Text style={styles.lineLabel}>Type:</Text>
                  <Text style={styles.lineValue}>
                    {item.is_free || !item.price_amount ? "Free Parking" : "Paid Parking"}
                  </Text>
                </View>

                <View style={styles.line}>
                  <Ionicons name="time-outline" size={18} color="#F59E0B" />
                  <Text style={styles.lineLabel}>{openRangeText(item)}</Text>
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
          }}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text style={{ color: "#6B7280" }}>
                No spaces found nearby. Try increasing the radius or adding entries near your GPS point.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom back bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* =========== styles =========== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  welcome: { flex: 1, color: "#111827", fontSize: 18, fontWeight: "600" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },

  bannerWrap: {
    width,
    height: 160,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    width,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotActive: { backgroundColor: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  distance: { color: "#6B7280", fontSize: 12 },

  // vehicle chips
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  chipInactive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  chipText: { marginLeft: 6, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: "#6B7280" },
  badge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: { backgroundColor: "#2563EB" },
  badgeInactive: { backgroundColor: "#E5E7EB" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  badgeTextActive: { color: "#fff" },
  badgeTextInactive: { color: "#6B7280" },

  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  lineLabel: { color: "#111827", fontSize: 14 },
  lineValue: { color: "#111827", fontWeight: "700" },

  thumb: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#E5E7EB",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    paddingLeft: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    marginLeft: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
