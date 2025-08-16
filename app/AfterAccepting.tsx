// app/AfterAccepting.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
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

const VEHICLE_TABS = ["All", "Cars", "Vans", "Bikes", "Buses"] as const;
type VehicleTab = typeof VEHICLE_TABS[number];

/** ===== API CONFIG (edit IP only) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const LIST_ENDPOINT = `${API_BASE}/list_space_details.php`;

/** ===== Simple promo carousel images ===== */
const PROMOS = [
  { id: "1", uri: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&q=60" },
  { id: "2", uri: "https://images.unsplash.com/photo-1542317853-0e4c2c132b4b?w=1200&q=60" },
  { id: "3", uri: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&q=60" },
];

/** ===== Utils ===== */
const toMoney = (s: Space) => {
  if (s.is_free) return "Free";
  if (s.pricing_text) return s.pricing_text;
  if (s.price_amount != null && s.price_unit) return `Rs ${s.price_amount} / ${s.price_unit}`;
  return "Paid Parking";
};

const windowWidth = Dimensions.get("window").width;
const pageWidth = windowWidth - 32;

export default function AfterAccepting() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollerRef = useRef<ScrollView>(null);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(LIST_ENDPOINT);
      const json = await res.json();
      if (!json?.success) throw new Error("Failed to load");

      const items: Space[] = (json.items ?? []).map((raw: any) => {
        const counts: VehicleCounts = Object.fromEntries(
          Object.entries(raw.vehicle_counts ?? {}).map(([k, v]) => [k, Number(v) || 0])
        );
        return {
          id: Number(raw.id),
          name: String(raw.name ?? ""),
          address: raw.address ?? "",
          location_label: raw.location_label ?? null,
          latitude: raw.latitude != null ? Number(raw.latitude) : null,
          longitude: raw.longitude != null ? Number(raw.longitude) : null,
          availability: Array.isArray(raw.availability) ? raw.availability : [],
          vehicle_counts: counts,
          spaces_available: Number(raw.spaces_available ?? 0),
          is_free: Boolean(raw.is_free),
          price_amount: raw.price_amount != null ? Number(raw.price_amount) : null,
          price_unit: raw.price_unit ?? null,
          pricing_text: raw.pricing_text ?? null,
          open_text: raw.open_text ?? "Open hours vary",
        };
      });

      setSpaces(items);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color="#222" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>Welcome Back,</Text>
          <Text style={styles.welcomeName}>User 👋</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#4F46E5" />
        </View>
      </View>

      {/* Promo carousel */}
      <View style={styles.promoWrap}>
        <ScrollView
          ref={scrollerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
            setActiveSlide(idx);
          }}
          scrollEventThrottle={16}
        >
          {PROMOS.map((p) => (
            <View key={p.id} style={{ width: pageWidth }}>
              <Image source={{ uri: p.uri }} style={styles.promoImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {PROMOS.map((p, i) => (
            <View key={p.id} style={[styles.dot, activeSlide === i && styles.dotActive]} />
          ))}
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading spaces…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b91c1c", fontWeight: "600" }}>{error}</Text>
        <TouchableOpacity style={[styles.chip, { marginTop: 14 }]} onPress={load}>
          <Text style={styles.chipText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <FlatList
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        data={spaces}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <SpaceCard
            space={item}
            onOpen={() =>
              // send the whole object safely
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

      {/* Floating action button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => {}}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

/** ===== Card ===== */
function SpaceCard({
  space,
  onOpen,
}: {
  space: Space;
  onOpen?: () => void;
}) {
  const location = space.location_label || space.address || space.name;
  const money = toMoney(space);
  const photo = "https://picsum.photos/seed/parking-illustration/800/420";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.card}>
        <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
          {/* Location */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color="#ef4444" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {/* Spaces summary (breakdown) */}
          <View style={styles.row}>
            <Ionicons name="car-outline" size={18} color="#2563eb" />
            <Text style={styles.metaText}>
              Spaces: Car {space.vehicle_counts.Cars ?? 0} • Van {space.vehicle_counts.Vans ?? 0} •
              Bike {space.vehicle_counts.Bikes ?? 0} • Bus {space.vehicle_counts.Buses ?? 0}
            </Text>
          </View>

          {/* Type: Free/Paid (+ price if available) */}
          <View style={styles.row}>
            <Ionicons name="pricetag-outline" size={18} color="#22c55e" />
            <Text style={styles.metaText}>
              Type: {space.is_free ? "Free" : "Paid"}
              {!space.is_free && money !== "Paid Parking" ? ` • ${money}` : ""}
            </Text>
          </View>

          {/* Open */}
          <View style={styles.row}>
            <Ionicons name="time-outline" size={18} color="#111827" />
            <Text style={styles.metaText}>{space.open_text}</Text>
          </View>
        </View>

        <Image source={{ uri: photo }} style={styles.cardImage} />
      </View>
    </TouchableOpacity>
  );
}

/** ===== Styles ===== */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  topbar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
  welcomeTitle: { fontSize: 14, color: "#6b7280", marginLeft: 4 },
  welcomeName: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginLeft: 4 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#eef2ff",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#e5e7eb",
  },

  promoWrap: {
    marginTop: 6, marginHorizontal: 16,
    borderRadius: 16, overflow: "hidden", backgroundColor: "#fff",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  promoImage: { height: 140, width: "100%" },
  dots: { flexDirection: "row", alignSelf: "center", paddingVertical: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#e5e7eb" },
  dotActive: { backgroundColor: "#111827" },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#F3F4F6" },
  chipText: { color: "#111827", fontWeight: "600" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  locationText: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  metaText: { color: "#374151", fontSize: 14 },
  cardImage: { width: "100%", height: 150, marginTop: 12 },

  empty: {
    flexDirection: "row", alignItems: "center",
    padding: 16, marginTop: 24, justifyContent: "center",
  },

  fab: {
    position: "absolute", right: 20, bottom: 24,
    backgroundColor: "#3B82F6", width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
});
