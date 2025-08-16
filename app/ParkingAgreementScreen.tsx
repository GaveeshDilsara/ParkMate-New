// app/ParkingAgreementScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** ===== API CONFIG (CHANGE ONLY THIS IP) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const UPLOAD_ENDPOINT = `${API_BASE}/save_parking_agreement.php`;

type PickedFile = { uri: string; name: string; mimeType: string };

export default function ParkingAgreementScreen() {
  const [pdf, setPdf] = React.useState<PickedFile | null>(null);
  const [images, setImages] = React.useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // If you can fetch these from storage or params, set them here (optional)
  const spaceIdRef = React.useRef<string | null>(null); // e.g., "123"
  const ownerIdRef = React.useRef<string | null>(null); // e.g., "45"

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      setPdf({
        uri: asset.uri,
        name: asset.name || "agreement.pdf",
        mimeType: asset.mimeType || "application/pdf",
      });
    } catch (e) {
      Alert.alert("Picker error", "Could not pick a PDF.");
    }
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow Photos access to pick images.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.85,
      });
      if (res.canceled) return;
      const a = res.assets?.[0];
      if (!a?.uri) return;

      if (images.length >= 6) {
        Alert.alert("Limit reached", "You can add up to 6 images.");
        return;
      }

      const guessedExt =
        a.fileName?.split(".").pop()?.toLowerCase() ||
        a.uri.split(".").pop()?.toLowerCase() ||
        "jpg";
      const mime =
        guessedExt === "png"
          ? "image/png"
          : guessedExt === "webp"
          ? "image/webp"
          : "image/jpeg";

      setImages((prev) => [
        ...prev,
        {
          uri: a.uri,
          name: a.fileName || `photo_${prev.length + 1}.${guessedExt}`,
          mimeType: mime,
        },
      ]);
    } catch (e) {
      Alert.alert("Picker error", "Could not pick an image.");
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitAgreement = async () => {
    if (!pdf) {
      Alert.alert("PDF required", "Please choose your agreement PDF first.");
      return;
    }

    const fd = new FormData();
    if (spaceIdRef.current) fd.append("space_id", spaceIdRef.current);
    if (ownerIdRef.current) fd.append("owner_id", ownerIdRef.current);

    // PDF
    fd.append("pdf", {
      uri: pdf.uri,
      name: pdf.name,
      type: pdf.mimeType || "application/pdf",
    } as any);

    // Images (optional)
    images.forEach((img) => {
      fd.append("images[]", {
        uri: img.uri,
        name: img.name,
        type: img.mimeType || "image/jpeg",
      } as any);
    });

    try {
      setSubmitting(true);
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        // Let fetch set the boundary automatically; don't force Content-Type
        body: fd,
      });
      const json = await res.json();
if (json?.success) {
  Alert.alert(
    "Uploaded ✅",
    `Agreement saved (ID: ${json.agreement_id}).`,
    [
      { text: "OK", onPress: () => router.replace("/RegisterSapceDetails") }
    ]
  );
  return;
}
else {
        Alert.alert("Upload failed", json?.message || "Server error.");
      }
    } catch (e) {
      Alert.alert("Network error", "Check your IP (API_BASE) and XAMPP.");
    } finally {
      setSubmitting(false);
    }
  };

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
          </Text>
        </View>

        {/* PDF Uploader */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Legal Document (PDF)</Text>

          <View style={styles.dropZone}>
            <Ionicons name="cloud-upload-outline" size={28} color="#2563EB" />
            <Text style={styles.dropTitle}>Tap the button to choose your PDF</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={pickPdf}>
                <Ionicons name="folder-open-outline" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>{pdf ? "Replace PDF" : "Choose PDF"}</Text>
              </TouchableOpacity>
              <View style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>View sample</Text>
              </View>
            </View>
            <Text style={styles.fileName}>{pdf ? pdf.name : "No file selected"}</Text>
          </View>
        </View>

        {/* Images Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Photos (optional)</Text>
          <Text style={styles.smallMuted}>Add up to 6 images showcasing the space.</Text>

          <View style={styles.grid}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageTile}>
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(idx)}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
                <Image source={{ uri: img.uri }} style={{ width: "90%", height: "60%", borderRadius: 8 }} resizeMode="cover" />
                <Text style={styles.tileText} numberOfLines={1}>{img.name}</Text>
              </View>
            ))}

            {Array.from({ length: Math.max(0, 6 - images.length) }).map((_, i) => (
              <TouchableOpacity key={`empty-${i}`} style={styles.imageTile} onPress={pickImage} activeOpacity={0.8}>
                <View style={styles.addBadge}>
                  <Ionicons name="add" size={14} color="#fff" />
                </View>
                <Ionicons name="image-outline" size={28} color="#667085" />
                <Text style={styles.tileText}>Add photo</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.footerCard}>
          <View style={[styles.btn, styles.btnGhostWide]}>
            <Text style={styles.btnGhostText}>Save draft</Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimaryWide]}
            onPress={submitAgreement}

            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Submit Agreement</Text>
            )}
          </TouchableOpacity>
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
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: palette.subtle,
    alignItems: "center", justifyContent: "center",
    marginRight: 8, borderWidth: 1, borderColor: palette.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.text },
  cardText: { color: palette.muted, lineHeight: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: palette.text, marginBottom: 10 },
  smallMuted: { color: palette.muted, fontSize: 12, marginBottom: 10 },
  dropZone: {
    borderWidth: 2, borderStyle: "dashed", borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFF", borderRadius: 14, alignItems: "center",
    justifyContent: "center", paddingVertical: 22,
  },
  dropTitle: { marginTop: 8, fontWeight: "800", color: palette.text },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  fileName: { marginTop: 10, color: palette.muted, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
  imageTile: {
    width: "31.5%", aspectRatio: 1,
    backgroundColor: "#F7FAFF", borderRadius: 12, borderWidth: 1, borderColor: "#D9E6FF",
    marginBottom: 10, alignItems: "center", justifyContent: "center", position: "relative",
  },
  addBadge: {
    position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: palette.primary, alignItems: "center", justifyContent: "center",
    shadowColor: "#002C8F", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  removeBadge: {
    position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center",
    shadowColor: "#7F1D1D", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  tileText: { marginTop: 6, fontSize: 11, color: palette.muted },
  hintRow: { flexDirection: "row", alignItems: "center" },
  hintText: { color: palette.muted, marginLeft: 6 },
  footerCard: {
    backgroundColor: palette.card, borderRadius: 16, borderWidth: 1, borderColor: palette.border,
    padding: 14, marginTop: 4, gap: 10, shadowColor: "#001244", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 2,
  },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
  },
  btnPrimary: { backgroundColor: palette.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D6E2FF" },
  btnGhostText: { color: palette.primary, fontWeight: "800" },
  btnPrimaryWide: { backgroundColor: palette.primary },
  btnGhostWide: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D6E2FF" },
});
