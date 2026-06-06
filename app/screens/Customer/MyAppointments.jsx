import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../api.js";

const STATUS_CONFIG = {
  accepted: { colors: ["#065f46", "#10b981"], icon: "checkmark-circle", label: "ACCEPTED" },
  confirmed: { colors: ["#065f46", "#10b981"], icon: "checkmark-circle", label: "CONFIRMED" },
  pending: { colors: ["#78350f", "#f59e0b"], icon: "time", label: "PENDING" },
  rejected: { colors: ["#7f1d1d", "#ef4444"], icon: "close-circle", label: "REJECTED" },
  cancelled: { colors: ["#7f1d1d", "#ef4444"], icon: "close-circle", label: "CANCELLED" },
};

const getStatus = (s) => STATUS_CONFIG[(s || "").toLowerCase()] || STATUS_CONFIG.pending;
const { width: SCREEN_W } = Dimensions.get("window");
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

const formatDateTime = (datetime) => {
  if (!datetime) return "Not set";
  try {
    const d = new Date(datetime);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date: `${day} ${month} ${year}`, time };
  } catch { return { date: datetime, time: "" }; }
};

function AppointmentCard({ item, onDelete, index }) {
  const slideAnim = React.useRef(new Animated.Value(60)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const statusCfg = getStatus(item.status);
  const { date, time } = formatDateTime(item.datetime);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* accent stripe */}
      <LinearGradient
        colors={statusCfg.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccent}
      />

      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.avatar}>
              <Ionicons name="cut" size={18} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.tailorName}>{item.tailor_name || "Unknown Tailor"}</Text>
            <Text style={styles.cardSub}>Appointment</Text>
          </View>
          <View style={[styles.statusBadge]}>
            <LinearGradient colors={statusCfg.colors} style={styles.statusGrad}>
              <Ionicons name={statusCfg.icon} size={11} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{statusCfg.label}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Date / time */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#E6B0B0" />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{date}</Text>
          </View>
          {!!time && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#E6B0B0" />
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{time}</Text>
            </View>
          )}
        </View>

        {/* Delete */}
        <Pressable style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
          <Ionicons name="trash-outline" size={14} color="#f87171" style={{ marginRight: 6 }} />
          <Text style={styles.deleteBtnText}>Remove</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function MyAppointment({ route, navigation }) {
  const customerEmail = route?.params?.email || route?.params?.CustomerEmail || "";
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/appointments/my-appointments`, { params: { email: customerEmail } });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.log("Appointment fetch error", err);
    } finally { setLoading(false); }
  };

  const deleteAppointment = (id) => {
    Alert.alert("Delete Appointment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/appointments/delete-appointment/${id}`);
            setAppointments((prev) => prev.filter((item) => item.id !== id));
          } catch (err) { console.log("Delete appointment error", err); }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Appointments</Text>
          <Text style={styles.headerSub}>{appointments.length} appointment{appointments.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAppointments}>
          <Ionicons name="refresh-outline" size={20} color="#E6B0B0" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#9D2A4B" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <LinearGradient colors={["rgba(157,42,75,0.25)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={40} color="#E6B0B0" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No appointments yet</Text>
          <Text style={styles.empty}>Book an appointment with a tailor to get started</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <AppointmentCard item={item} onDelete={deleteAppointment} index={index} />
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16,
    paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,176,176,0.08)",
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "#E6B0B0", fontWeight: "600", marginTop: 2 },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  list: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 40, paddingTop: 16, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  card: {
    borderRadius: 22,
    marginBottom: 16,
    backgroundColor: "#1a0610",
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.25)",
    overflow: "hidden",
    shadowColor: "#9D2A4B",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  cardAccent: { height: 3 },
  cardContent: { padding: 18 },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {},
  avatar: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  tailorName: { color: "#fff", fontSize: 17, fontWeight: "800" },
  cardSub: { color: "#E6B0B0", fontSize: 12, marginTop: 2, fontWeight: "600" },
  statusBadge: { borderRadius: 10, overflow: "hidden" },
  statusGrad: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "rgba(157,42,75,0.15)", marginVertical: 14 },
  infoRow: { flexDirection: "row", gap: 24 },
  infoItem: { gap: 3 },
  infoLabel: { color: "#E6B0B0", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: 4 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center",
    marginTop: 14, alignSelf: "flex-end",
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  deleteBtnText: { color: "#f87171", fontSize: 13, fontWeight: "700" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#E6B0B0", marginTop: 12, fontSize: 15, fontWeight: "600" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
  },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  empty: { color: "#E6B0B0", fontSize: 15, textAlign: "center", lineHeight: 22 },
});
