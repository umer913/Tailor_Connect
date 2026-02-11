import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const timeSlots = [
  "10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM",
  "4:00 PM","5:00 PM","6:00 PM",
  "7:00 PM","8:00 PM","9:00 PM","10:00 PM"
];

export default function BookAppointment({ route, navigation }) {
  // Ensure the keys here match the backend keys exactly
  const {email, CustomerEmail, tailor_name } = route.params;
console.log("Received params:", { email, CustomerEmail, tailor_name });
  const tailor_email = email; // Renamed for clarity
const customer_email = CustomerEmail; // Renamed for clarity
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  function combineDateTime(dateObj, timeString) {
    const [time, meridian] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const newDateTime = new Date(dateObj);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    newDateTime.setSeconds(0);
    newDateTime.setMilliseconds(0);

    return newDateTime;
  }

  async function confirmAppointment() {
    if (!selectedSlot) {
      Alert.alert("Please select a time slot");
      return;
    }

    const combinedDateTime = combineDateTime(date, selectedSlot);
    setLoading(true);

    const payload = {
      tailor_email,
      customer_email,
      datetime: combinedDateTime.toISOString(),
      tailor_name,
    };

    console.log("Sending payload:", payload);

    try {
      const response = await axios.post(
        "http://localhost:3000/book-appointment",
        payload
      );

      console.log("Response data:", response.data);

      if (response.data.success) {
        Alert.alert("Success", "Appointment booked successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.data.message || "Failed to book appointment.");
      }
    } catch (error) {
      console.error("Axios error details:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#0f172a", "#1b254f"]} style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.tailor}>{tailor_name}</Text>

        {/* Date Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar" size={22} color="#92a6e8" />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date()}
              onChange={(e, d) => {
                setShowPicker(false);
                if (d) setDate(d);
              }}
            />
          )}
        </View>

        {/* Time Slots */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.slots}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                style={[styles.slot, selectedSlot === slot && styles.slotActive]}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {selectedSlot && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>📅 {date.toDateString()}</Text>
            <Text style={styles.summaryText}>⏰ {selectedSlot}</Text>
          </View>
        )}

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
          onPress={confirmAppointment}
          disabled={loading}
        >
          <Text style={styles.confirmText}>{loading ? "Booking..." : "Confirm Appointment"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  backBtn: {
    backgroundColor: "#3b4ca3",
    padding: 10,
    borderRadius: 30,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 20,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  tailor: {
    color: "#92a6e8",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#24306a",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b254f",
    padding: 14,
    borderRadius: 14,
  },
  dateText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 16,
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  slot: {
    backgroundColor: "#1b254f",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  slotActive: {
    backgroundColor: "#64769e",
  },
  slotText: {
    color: "#92a6e8",
    fontWeight: "600",
  },
  slotTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  summary: {
    backgroundColor: "#1b254f",
    padding: 18,
    borderRadius: 18,
    marginBottom: 25,
  },
  summaryText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
  },
  confirmBtn: {
    backgroundColor: "#64769e",
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    shadowOpacity: 0.8,
    elevation: 12,
  },
  confirmText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
