import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
];

const Appointment = ({ route,navigation }) => {
  const { email } = route.params;

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch saved availability on mount
  useEffect(() => {
    async function fetchAvailability() {
      try {
            const res = await axios.get('http://UF-MacBook-Pro.local:3000/get-availability', {
        params: { email }
      });

        setAvailability(res.data.availability || {});
      } catch (error) {
        Alert.alert("Error", "Failed to load availability");
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [email]);

  const toggleSlot = (day, time) => {
    const daySlots = availability[day] || [];
    const updatedSlots = daySlots.includes(time)
      ? daySlots.filter((t) => t !== time)//if time is selected remove it from list 
      : [...daySlots, time];//if time is not selected add it to list

   
    const newAvailability = { ...availability };
    if (updatedSlots.length === 0) {
      delete newAvailability[day];
    } else {
      newAvailability[day] = updatedSlots;
    }

    setAvailability(newAvailability);
  };

  const saveAvailability = async () => {
   
    setSaving(true);

    try {
      await axios.post("http://UF-MacBook-Pro.local:3000/save-availability", {
        email,
        availability,
      });
      Alert.alert("Success", "Availability saved!");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#2B0F14", "#3A1419", "#4A1C22"]}
        style={[styles.container, styles.center]}
      >
        <ActivityIndicator size="large" color="#E6B0B0" />
        <Text style={{ color: "#E6B0B0", marginTop: 12 }}>Loading availability...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#2B0F14", "#3A1419", "#4A1C22"]} style={styles.container}>
          
      <ScrollView contentContainerStyle={styles.scroll}>
      <TouchableOpacity
          style={styles.backButton}
          onPress={() =>navigation.navigate("TailorDrawer", {
            email: email})}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Weekly Availability</Text>
        <Text style={styles.subtitle}>Select the time slots you are available (10 AM – 10 PM)</Text>

        {days.map((day) => (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>

            <View style={styles.slotContainer}>
              {timeSlots.map((time) => {
                const selected = availability[day]?.includes(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.slot, selected && styles.slotSelected]}
                    onPress={() => toggleSlot(day, time)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          activeOpacity={0.9}
          onPress={saveAvailability}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Availability"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F2E6E6",
    textAlign: "center",
    marginTop: 90,
  },

  subtitle: {
    fontSize: 15,
    color: "#E6B0B0",
    textAlign: "center",
    marginBottom: 25,
  },

  dayCard: {
    backgroundColor: "#3A1419",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowColor: "#1A070A",
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },

  dayTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E6B0B0",
    marginBottom: 14,
  },

  slotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  slot: {
    backgroundColor: "#5C1620",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#7A1F2B",
    margin: 4,
  },

  slotSelected: {
    backgroundColor: "#E6B0B0",
    borderColor: "#F2E6E6",
  },

  slotText: {
    color: "#F2E6E6",
    fontSize: 13,
    fontWeight: "700",
  },

  slotTextSelected: {
    color: "#4A1C22",
    fontWeight: "900",
  },

  saveBtn: {
    backgroundColor: "#7A1F2B",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#1A070A",
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  backButton: {
    position: "absolute",
    left: 40,
    top: 50,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
export default Appointment;