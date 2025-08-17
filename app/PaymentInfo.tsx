import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** ===== API (edit IP only) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const SPACE_GET = (id: number) => `${API_BASE}/space_details_get.php?id=${id}`;
const SESSION_GET = (id: number) => `${API_BASE}/vehicles_api.php?action=session&id=${id}`;

/** ===== Types ===== */
type VehicleKind = "Cars" | "Vans" | "Bikes" | "Buses";

type PaymentParams = { details?: string }; // encoded JSON from ShowParkingSpaceDetails
type Payload = {
  session_id: number;
  space_id: number;
  vehicle_no?: string;
  category?: VehicleKind;
};

type SpacePricing = {
  is_free: boolean;
  price_amount: number | null;
  price_unit: "hour" | "day" | null;
  pricing_text: string | null;
};

type SessionRow = {
  id: number;
  space_id: number;
  vehicle_no: string;
  category: VehicleKind;
  start_time: string; // "YYYY-MM-DD HH:MM:SS" from MySQL
  end_time: string | null;
  status: "in" | "out";
};

/** ===== Helpers (robust time) ===== */
/** Parse MySQL DATETIME ("YYYY-MM-DD HH:MM:SS") as LOCAL time */
const parseSqlDateLocal = (s: string) => {
  // Ensure ISO-like with 'T', no 'Z' so JS treats it as local time
  const isoLike = s.replace(" ", "T");
  return new Date(isoLike);
};

const fmtLocalTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    // If you want to force SL time on all devices:
    // timeZone: "Asia/Colombo",
  })
    .format(d)
    .replace("AM", "am")
    .replace("PM", "pm");

const ceil = (n: number) => Math.ceil(n);

/** Use Date objects to avoid parsing inconsistencies */
function computeDurationByDate(start: Date, end: Date) {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const mins = Math.round(ms / 60000);
  const hrsRounded = Math.max(1, ceil(mins / 60)); // round up to next hour min=1
  const pretty = mins < 60 ? `${mins} mins` : `${hrsRounded} ${hrsRounded === 1 ? "hr" : "hrs"}`;
  return { mins, hrsRounded, pretty };
}
const toMoney = (n: number) => `Rs.${n.toFixed(0)}`;

/** ===== Screen ===== */
export default function PaymentInfo() {
  const router = useRouter();
  const { details } = useLocalSearchParams<PaymentParams>();

  const payload: Payload | null = useMemo(() => {
    try {
      return details ? JSON.parse(decodeURIComponent(details)) : null;
    } catch {
      return null;
    }
  }, [details]);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [pricing, setPricing] = useState<SpacePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [openTop, setOpenTop] = useState(true);
  const [openInfo, setOpenInfo] = useState(true);

  // fetch session (vehicles) + pricing (space_details)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!payload) return;
      try {
        const [sRes, pRes] = await Promise.all([
          fetch(SESSION_GET(payload.session_id)),
          fetch(SPACE_GET(payload.space_id)),
        ]);
        const sJ = await sRes.json();
        const pJ = await pRes.json();

        if (!sJ?.success) throw new Error("Session not found");

        if (mounted) {
          setSession(sJ.item as SessionRow);
          setPricing({
            is_free: !!pJ?.is_free,
            price_amount: pJ?.price_amount != null ? Number(pJ.price_amount) : null,
            price_unit: pJ?.price_unit ?? null,
            pricing_text: pJ?.pricing_text ?? null,
          });
        }
      } catch (e) {
        if (mounted) {
          setSession(null);
          setPricing({ is_free: true, price_amount: null, price_unit: null, pricing_text: "Free" });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [payload]);

  if (!payload) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Missing payment details</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build Date objects safely
  const startDate =
    session?.start_time ? parseSqlDateLocal(session.start_time) : new Date();
  const endDate =
    (session?.end_time ? parseSqlDateLocal(session.end_time) : null) || new Date();

  const { mins, hrsRounded, pretty } = computeDurationByDate(startDate, endDate);

  const rateLabel =
    pricing?.is_free
      ? "Free"
      : pricing?.price_amount != null && pricing?.price_unit
      ? `Rs.${pricing.price_amount} per ${pricing.price_unit === "hour" ? "hr" : "day"}`
      : "Paid";

  let total = 0;
  if (!pricing?.is_free && pricing?.price_amount != null && pricing?.price_unit) {
    if (pricing.price_unit === "hour") {
      total = hrsRounded * pricing.price_amount; // round up to next hour
    } else {
      const daysRounded = Math.max(1, ceil(mins / (60 * 24)));
      total = daysRounded * pricing.price_amount;
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Payment Info",
          headerTitleStyle: { fontWeight: "800", color: "#fff" },
          headerStyle: { backgroundColor: "#3B82F6" },
          headerTintColor: "#fff",
          headerRight: () => (
            <View style={styles.avatar}>
              <Ionicons name="person" color="#1E3A8A" size={16} />
            </View>
          ),
          headerLeft: () => <Ionicons name="ellipsis-vertical" color="#fff" size={18} />,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Total time card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.h1}>Total Parking Time</Text>
            <Ionicons name="card-outline" size={20} color="#111827" />
          </View>

          <Text style={styles.bigTime}>{pretty}</Text>

          <View style={styles.rateRow}>
            <View style={styles.rateChip}>
              <Text style={styles.rateText}>{rateLabel}</Text>
            </View>
            <TouchableOpacity onPress={() => setOpenTop((v) => !v)} style={styles.chevBtn}>
              <Ionicons name={openTop ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {openTop && session && (
            <Text style={styles.muted}>
              #{session.id} • {session.vehicle_no} • {session.category.replace(/s$/, "")}
            </Text>
          )}
        </View>

        {/* Info section */}
        <TouchableOpacity style={styles.sectionHead} onPress={() => setOpenInfo((v) => !v)} activeOpacity={0.85}>
          <Text style={styles.sectionTitle}>Info</Text>
          <Ionicons name={openInfo ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
        </TouchableOpacity>

        {openInfo && (
          <View style={styles.card}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{session?.category?.replace(/s$/, "") || "-"}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Arrival Time</Text>
              <Text style={styles.value}>{fmtLocalTime(startDate)}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Leave Time</Text>
              <Text style={styles.value}>{fmtLocalTime(endDate)}</Text>
            </View>
          </View>
        )}

        {/* Total Amount */}
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <Text style={[styles.label, { fontWeight: "800" }]}>Total Amount</Text>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={[styles.value, { fontWeight: "900" }]}>
                {pricing?.is_free ? "Rs.0" : toMoney(total)}
              </Text>
            )}
          </View>
        </View>

        {/* OK button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { alignSelf: "center", marginTop: 8 }]}
          onPress={() => router.back()}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryText}>Ok</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#E0E7FF",
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#c7d2fe",
    marginRight: 6,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderColor: "#E5E7EB",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  h1: { fontSize: 14, fontWeight: "800", color: "#111827" },
  bigTime: { fontSize: 26, fontWeight: "900", color: "#111827", marginTop: 6 },
  muted: { marginTop: 8, color: "#6B7280" },
  rateRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  rateChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#D1FAE5" },
  rateText: { color: "#065F46", fontWeight: "800", fontSize: 12 },
  chevBtn: { marginLeft: "auto", padding: 6 },

  sectionHead: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: { fontWeight: "800", color: "#111827", fontSize: 14, flex: 1 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  label: { color: "#4B5563" },
  value: { color: "#111827", fontWeight: "700" },

  primaryBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
