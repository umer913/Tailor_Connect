import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function MyAppointment({ route }) {
  const customerEmail = route?.params?.email || "";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAppointments();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // ---------------- FETCH ----------------
  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `http://UF-MacBook-Pro.local:3000/my-appointments?email=${customerEmail}`
      );
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.log("Appointment fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE WITH CONFIRM ----------------
  const deleteAppointment = (id) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `http://UF-MacBook-Pro.local:3000/delete-appointment/${id}`
              );

              setAppointments((prev) =>
                prev.filter((item) => item.id !== id)
              );
            } catch (err) {
              console.log("Delete appointment error", err);
            }
          },
        },
      ]
    );
  };

  // ---------------- UI ITEM ----------------
  const renderItem = ({ item }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.tailorName}>
          {item.tailor_name || "Unknown Tailor"}
        </Text>

        <View style={styles.rightHeader}>
          <Text style={[styles.status, statusStyle(item.status)]}>
            {item.status.toUpperCase()}
          </Text>

          <Pressable
            style={styles.closeBtn}
            onPress={() => deleteAppointment(item.id)}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.info}>📅 Day: {item.day}</Text>
      <Text style={styles.info}>⏰ Time: {item.time}</Text>
    </Animated.View>
  );

  // ---------------- LOADER ----------------
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ---------------- MAIN ----------------
  return (
    <LinearGradient
      colors={["#1f2933", "#111827"]}
      style={styles.container}
    >
      <Text style={styles.title}>My Appointments</Text>

      {appointments.length === 0 ? (
        <Text style={styles.empty}>No appointments found</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </LinearGradient>
  );
}

// ---------------- STATUS COLORS ----------------
const statusStyle = (status) => ({
  backgroundColor:
    status === "accepted"
      ? "#16a34a"
      : status === "rejected"
      ? "#dc2626"
      : "#f59e0b",
});

// ---------------- STYLES (TailorX Theme) ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },

  card: {
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tailorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  status: {
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
  },

  closeBtn: {
    backgroundColor: "#374151",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "700",
  },

  info: {
    fontSize: 15,
    color: "#d1d5db",
    marginTop: 4,
  },

  empty: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
    color: "#9ca3af",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
