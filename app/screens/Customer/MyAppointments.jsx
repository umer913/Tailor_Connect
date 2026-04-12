import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyAppointment({ route, navigation }) {
  const customerEmail = route?.params?.email || "";
  console.log("Customer email in MyAppointments:", customerEmail);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format datetime to: "9/January/2025 time="
  const formatDateTime = (datetime) => {
    if (!datetime) return "Not set";
    try {
      const date = new Date(datetime);
      const day = date.getDate();
      const monthName = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${day}/${monthName}/${year} time=${time}`;
    } catch (e) {
      return datetime;
    }
  };

const statusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "accepted":
      return { backgroundColor: "#4CAF50" };
    case "rejected":
      return { backgroundColor: "#F44336" };
    case "pending":
      return { backgroundColor: "#FFC107" };
    case "confirmed":
      return { backgroundColor: "#4CAF50" };
    case "cancelled":
      return { backgroundColor: "#F44336" };
    default:
      return { backgroundColor: "#4CAF50" }; // Default to green instead of gray
  }
};

  // ✅ fade animation using useState instead of useRef
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "http://UF-MacBook-Pro.local:3000/my-appointments",
          { params: { email: customerEmail } }
        );
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.log("Appointment fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const deleteAppointment = (id) => {
    Alert.alert("Delete Appointment", "Are you sure?", [
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
    ]);
  };

  return (
    <LinearGradient
      colors={["#1b254f", "#0c1435", "#080927"]}
      style={styles.container}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.navigate("CustomerDashboard", { customerEmail })
        }
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>My Appointments</Text>

      {/* Loader / Empty / List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : appointments.length === 0 ? (
        <Text style={styles.empty}>No appointments found</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const slideAnim = new Animated.Value(40);

            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }).start();

            return (
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.header}>
                  <Text style={styles.tailorName}>
                    {item.tailor_name || "Unknown Tailor"}
                  </Text>

                  <View style={styles.rightHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        statusStyle(item.status),
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.closeBtn}
                      onPress={() => deleteAppointment(item.id)}
                    >
                      <Text style={styles.closeText}>✕</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.info}>📅 Timing: {formatDateTime(item.datetime)}</Text>
               
              </Animated.View>
            );
          }}
        />
      )}
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 20,
  },

  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    padding: 10,
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
    zIndex: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#d1d9ff",
    marginBottom: 25,
    textAlign: "center",
  },

  card: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tailorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d1d9ff",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  closeBtn: {
    backgroundColor: "rgba(216,91,91,0.2)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#d85b5b",
    fontSize: 14,
    fontWeight: "700",
  },

  info: {
    fontSize: 15,
    color: "#8e9ccf",
    marginTop: 4,
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 120,
    color: "#8e9ccf",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
