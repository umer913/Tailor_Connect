import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const timeSlots = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM",
  "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 760 : IS_TABLET ? 680 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

export default function BookAppointment({ route, navigation }) {
  const { email, CustomerEmail, tailor_name } = route.params;
  const tailor_email = email;
  const customer_email = CustomerEmail;
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
    const payload = { tailor_email, customer_email, datetime: combinedDateTime.toISOString(), tailor_name };
    try {
      const response = await axios.post("http://localhost:3001/appointments/book-appointment", payload);
      if (response.data.success) {
        Alert.alert("Success", "Appointment booked successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", response.data.message || "Failed to book appointment.");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <Text style={styles.headerSub}>with {tailor_name}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Date Card */}
        <View style={styles.sectionLabel}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionText}>SELECT DATE</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.dateIconWrap}>
              <Ionicons name="calendar" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.dateLabelText}>Appointment Date</Text>
              <Text style={styles.dateText}>{date.toDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(230,176,176,0.4)" />
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
        <View style={styles.sectionLabel}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionText}>SELECT TIME SLOT</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.slots}>
            {timeSlots.map((slot) => {
              const isActive = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.75}
                  style={[styles.slot, isActive && styles.slotActive]}
                >
                  {isActive && (
                    <LinearGradient
                      colors={["#9D2A4B", "#D6406A"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={isActive ? "#fff" : "#E6B0B0"}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.slotText, isActive && styles.slotTextActive]}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        {selectedSlot && (
          <LinearGradient
            colors={["rgba(157,42,75,0.15)", "rgba(214,64,106,0.1)"]}
            style={styles.summary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color="#E6B0B0" />
              <Text style={styles.summaryText}>{date.toDateString()}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Ionicons name="time-outline" size={18} color="#E6B0B0" />
              <Text style={styles.summaryText}>{selectedSlot}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Confirm */}
        <TouchableOpacity
          onPress={confirmAppointment}
          disabled={loading}
          activeOpacity={0.85}
          style={{ marginTop: 10 }}
        >
          <LinearGradient
            colors={loading ? ["#374151", "#374151"] : ["#9D2A4B", "#D6406A"]}
            style={styles.confirmBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <Text style={styles.confirmText}>Booking...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.confirmText}>Confirm Appointment</Text>
              </>
            )}
          </LinearGradient>
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
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,176,176,0.08)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "#E6B0B0", fontSize: 13, marginTop: 2, fontWeight: "600" },
  container: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 60, paddingTop: 20, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9D2A4B",
    marginRight: 10,
  },
  sectionText: {
    color: "#E6B0B0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  card: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.2)",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabelText: {
    color: "#E6B0B0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dateText: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.25)",
    backgroundColor: "rgba(26, 6, 16, 0.6)",
    overflow: "hidden",
  },
  slotActive: {
    borderColor: "#D6406A",
    shadowColor: "#D6406A",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  slotText: { color: "#E6B0B0", fontSize: 13, fontWeight: "600" },
  slotTextActive: { color: "#fff", fontWeight: "700" },
  summary: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.25)",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryText: { color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 10 },
  confirmBtn: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9D2A4B",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  confirmText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
