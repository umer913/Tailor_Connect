import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";

export default function MyAppointment({ route, navigation }) {
  const customerEmail = route?.params?.email || "";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchAppointments();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

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

  /* ---------------- DELETE ---------------- */
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

  /* ---------------- ITEM ---------------- */
  const renderItem = ({ item, index }) => {
    const slideAnim = new Animated.Value(40);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      delay: index * 80,
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

        <Text style={styles.info}>📅 Day: {item.day}</Text>
        <Text style={styles.info}>⏰ Time: {item.time}</Text>
      </Animated.View>
    );
  };

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  /* ---------------- MAIN ---------------- */
  return (
    <LinearGradient
      colors={["#64769eff", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      {/* 🔙 SINGLE BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>My Appointments</Text>

      {appointments.length === 0 ? (
        <Text style={styles.empty}>No appointments found</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

/* ---------------- STATUS COLORS ---------------- */
const statusStyle = (status) => ({
  backgroundColor:
    status === "accepted"
      ? "#4CAF50"
      : status === "rejected"
      ? "#d85b5b"
      : "#f59e0b",
});

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
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    zIndex: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f8f4f4ff",
    marginBottom: 25,
    marginLeft: 45,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
    color: "#333",
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
    backgroundColor: "#f2f2f2",
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
    color: "#555",
    marginTop: 4,
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 120,
    color: "#f1f1f1",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#192f6a",
  },
});
