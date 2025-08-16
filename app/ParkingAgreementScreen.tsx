// app/ParkingAgreementScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ParkingAgreementScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Agreement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="document-text-outline" size={18} color="#1E3A8A" />
            </View>
            <Text style={styles.cardTitle}>Upload Agreement</Text>
          </View>
          <Text style={styles.cardText}>
            Please provide your legal parking agreement as a PDF and add a few photos of the space.
            This screen is UI-only (no upload wired yet).
          </Text>
        </View>

        {/* PDF Uploader (UI only) */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Legal Document (PDF)</Text>

          <View style={styles.dropZone}>
            <Ionicons name="cloud-upload-outline" size={28} color="#2563EB" />
            <Text style={styles.dropTitle}>Drag & drop your PDF</Text>
            <Text style={styles.dropHint}>or</Text>
            <View style={styles.btnRow}>
              <View style={[styles.btn, styles.btnPrimary]}>
                <Ionicons name="folder-open-outline" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Choose PDF</Text>
              </View>
              <View style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>View sample</Text>
              </View>
            </View>
            <Text style={styles.fileName}>No file selected</Text>
          </View>
        </View>

        {/* Images Grid (UI only) */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Photos (optional)</Text>
          <Text style={styles.smallMuted}>Add up to 6 images showcasing the space.</Text>

          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.imageTile}>
                <View style={styles.addBadge}>
                  <Ionicons name="add" size={14} color="#fff" />
                </View>
                <Ionicons name="image-outline" size={28} color="#667085" />
                <Text style={styles.tileText}>Add photo</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.card, { paddingTop: 14 }]}>
          <Text style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={16} color="#2563EB" />{" "}
            <Text style={styles.hintText}>
              Clear, well-lit photos help reviewers approve faster.
            </Text>
          </Text>
        </View>

        {/* Bottom Actions (UI only) */}
        <View style={styles.footerCard}>
          <View style={[styles.btn, styles.btnGhostWide]}>
            <Text style={styles.btnGhostText}>Save draft</Text>
          </View>
          <View style={[styles.btn, styles.btnPrimaryWide]}>
            <Text style={styles.btnPrimaryText}>Submit Agreement</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const palette = {
  bg: "#ECF2FF",
  card: "#FFFFFF",
  border: "#E6EAF5",
  text: "#0F172A",
  muted: "#667085",
  primary: "#2563EB",
  header: "#1D4ED8",
  subtle: "#F4F7FF",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

  header: {
    backgroundColor: palette.header,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 10, android: 14 }),
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#0B1B5E",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  container: { padding: 16 },

  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#001244",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: palette.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.text },
  cardText: { color: palette.muted, lineHeight: 20 },

  sectionLabel: { fontSize: 14, fontWeight: "800", color: palette.text, marginBottom: 10 },
  smallMuted: { color: palette.muted, fontSize: 12, marginBottom: 10 },

  dropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
  },
  dropTitle: { marginTop: 8, fontWeight: "800", color: palette.text },
  dropHint: { color: palette.muted, marginVertical: 6 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  fileName: { marginTop: 10, color: palette.muted, fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  imageTile: {
    width: "31.5%",
    aspectRatio: 1,
    backgroundColor: "#F7FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E6FF",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  addBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#002C8F",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  tileText: { marginTop: 6, fontSize: 11, color: palette.muted },

  hintRow: { flexDirection: "row", alignItems: "center" },
  hintText: { color: palette.muted, marginLeft: 6 },

  footerCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginTop: 4,
    gap: 10,
    shadowColor: "#001244",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnPrimary: { backgroundColor: palette.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D6E2FF",
  },
  btnGhostText: { color: palette.primary, fontWeight: "800" },

  btnPrimaryWide: { backgroundColor: palette.primary },
  btnGhostWide: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D6E2FF",
  },
});
