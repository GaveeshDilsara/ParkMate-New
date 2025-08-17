// app/PaymentInfo.tsx
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
import { SafeAreaView } from "react-native-safe-area-context";

/** ===== THEME ===== */
const BLUE = "#0099ff";
const BG = "#f6f7fb";
const CARD = "#ffffff";
const BORDER = "#e6e9f2";
const TEXT = "#0f172a";
const MUTED = "#6b7280";

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
const parseSqlDateLocal = (s: string) => {
  const isoLike = s.replace(" ", "T"); // treat as local time
  return new Date(isoLike);
};

const fmtLocalTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace("AM", "am")
    .replace("PM", "pm");

const ceil = (n: number) => Math.ceil(n);

function computeDurationByDate(start: Date, end: Date) {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const mins = Math.round(ms / 60000);
  const hrsRounded = Math.max(1, ceil(mins / 60)); // round up to next hour
  const pretty = mins < 60 ? `${mins} mins` : `${hrsRounded} ${hrsRounded === 1 ? "hr" : "hrs"}`;
  return { mins, hrsRounded, pretty };
}

const toMoney = (n: number) => `Rs.${n.toFixed(0)}`;

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
      } catch {
        if (mounted) {
          setSession(null);
          setPricing({ is_free: true, price_amount: null, price_unit: null, pricing_text: "Free" });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [payload]);

  if (!payload) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Missing payment details</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Build Date objects safely
  const startDate = session?.start_time ? parseSqlDateLocal(session.start_time) : new Date();
  const endDate = (session?.end_time ? parseSqlDateLocal(session.end_time) : null) || new Date();
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
      total = hrsRounded * pricing.price_amount;
    } else {
      const daysRounded = Math.max(1, ceil(mins / (60 * 24)));
      total = daysRounded * pricing.price_amount;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Payment Info",
          headerTitleStyle: { fontWeight: "800", color: "#fff" },
          headerStyle: { backgroundColor: BLUE },
          headerTintColor: "#fff",
          headerShadowVisible: false,
          // keep default back arrow (no headerLeft override)
          headerRight: () => (
            <View style={styles.avatar}>
              <Ionicons name="person" color={BLUE} size={16} />
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* TOTAL CARD */}
        <View style={styles.totalCard}>
          <View style={styles.totalTopRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.rateChip}>
              <Ionicons name={pricing?.is_free ? "gift-outline" : "cash-outline"} size={14} color="#fff" />
              <Text style={styles.rateChipText}>{rateLabel}</Text>
            </View>
          </View>

          <Text style={styles.totalAmount}>
            {pricing?.is_free ? "Rs.0" : toMoney(total)}
          </Text>

          <View style={styles.timeRow}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color={TEXT} />
              <Text style={styles.timeBadgeText}>{pretty}</Text>
            </View>

            <TouchableOpacity onPress={() => setOpenTop((v) => !v)} style={styles.chevBtn}>
              <Ionicons name={openTop ? "chevron-up" : "chevron-down"} size={18} color="#e6f2ff" />
            </TouchableOpacity>
          </View>

          {openTop && session && (
            <View style={styles.metaRow}>
              <Ionicons name="pricetag-outline" size={14} color="#e6f2ff" />
              <Text style={styles.metaText}>
                #{session.id} • {session.vehicle_no} • {session.category?.replace(/s$/, "")}
              </Text>
            </View>
          )}
        </View>

        {/* INFO SECTION HEADER */}
        <TouchableOpacity style={styles.sectionHead} onPress={() => setOpenInfo((v) => !v)} activeOpacity={0.88}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={TEXT} />
            <Text style={styles.sectionTitle}>Details</Text>
          </View>
          <Ionicons name={openInfo ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
        </TouchableOpacity>

        {/* INFO CARD */}
        {openInfo && (
          <View style={styles.card}>
            <Row label="Vehicle Type" value={session?.category?.replace(/s$/, "") || "-"} icon="car-outline" />
            <Row label="Arrival Time" value={fmtLocalTime(startDate)} icon="log-in-outline" />
            <Row label="Leave Time" value={fmtLocalTime(endDate)} icon="log-out-outline" />
          </View>
        )}

        {/* BREAKDOWN CARD (optional visual context) */}
        <View style={styles.card}>
          <LabelValue label="Rate applied" value={rateLabel} />
          <LabelValue
            label="Duration billed"
            value={
              pricing?.is_free
                ? "0"
                : pricing?.price_unit === "day"
                ? `${Math.max(1, ceil(mins / (60 * 24)))} day(s)`
                : `${hrsRounded} hr(s)`
            }
          />
          <LabelValue
            label="Total amount"
            value={pricing?.is_free ? "Rs.0" : toMoney(total)}
            strong
          />
        </View>

        {/* ACTION */}
        <TouchableOpacity
          style={[styles.primaryBtn, { alignSelf: "center", marginTop: 6 }]}
          onPress={() => router.back()}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Inline loader for total when fetching */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 6 }}>Calculating…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ========= tiny presentational helpers ========= */
function Row({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={14} color={BLUE} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
function LabelValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.lvRow}>
      <Text style={styles.lvLabel}>{label}</Text>
      <Text style={[styles.lvValue, strong && { fontWeight: "900", color: TEXT }]}>{value}</Text>
    </View>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  center: { alignItems: "center", justifyContent: "center" },

  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#eaf2ff",
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#cfe4ff",
    marginRight: 8,
  },

  /* Total Card (hero) */
  totalCard: {
    backgroundColor: BLUE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  totalTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { color: "#e6f2ff", fontWeight: "800", letterSpacing: 0.3 },
  rateChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
  },
  rateChipText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  totalAmount: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },

  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  timeBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#eaf2ff",
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 999,
  },
  timeBadgeText: { color: TEXT, fontWeight: "800" },
  chevBtn: { marginLeft: "auto", padding: 6 },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  metaText: { color: "#e6f2ff", fontWeight: "700" },

  /* Section header */
  sectionHead: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontWeight: "800", color: TEXT, fontSize: 14 },

  /* Cards */
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderColor: BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },

  /* Info rows */
  rowItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#eaf7ff",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#d7ecff",
  },
  rowLabel: { color: MUTED, fontWeight: "800" },
  rowValue: { color: TEXT, fontWeight: "800" },

  /* Breakdown rows */
  lvRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  lvLabel: { color: MUTED, fontWeight: "700" },
  lvValue: { color: TEXT, fontWeight: "800" },

  /* Buttons */
  primaryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  /* Loader overlay */
  loadingOverlay: {
    position: "absolute",
    right: 16, bottom: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
