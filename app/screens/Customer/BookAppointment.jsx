import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
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

export default function BookAppointment({ route, navigation }) {
  const { email, CustomerEmail,tailor_name } = route.params;
  console.log("Tailor name:", tailor_name);
  const [availability, setAvailability] = useState({});
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);
  try {
    // Fetch availability
    const availRes = await axios.get("http://UF-MacBook-Pro.local:3000/get-availability", {
      params: { email }
    });

    // Fetch booked slots
    const bookedRes = await axios.get("http://UF-MacBook-Pro.local:3000/get-booked-slots", {
      params: { email }
    });

    setAvailability(availRes.data.availability || {});
    setBookedSlots(bookedRes.data.booked || []);

  } catch (error) {
    console.log("Load error", error);
  } finally {
    setLoading(false);
  }
};

  const isBooked = (day, time) => {
    return bookedSlots.some((b) => b.day === day && b.time === time);
  };

  const book = async () => {
    if (!selected) {
      return Alert.alert("Select a slot", "Please select a time slot before booking.");
    }

    setBookingLoading(true);

    try {
      const response = await axios.post("http://UF-MacBook-Pro.local:3000/book-appointment", {
        tailor_name:tailor_name,
        tailor_email: email,
        customer_email: CustomerEmail,
        day: selected.day,
        time: selected.time,
      });

      Alert.alert("Booked", response.data.message || "Appointment confirmed");
      if (navigation.canGoBack()) navigation.goBack();

    } catch (error) {
      console.log("Booking error:", error);
      Alert.alert("Error", "Failed to book appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#64769e" />
        <Text style={{ marginTop: 10, color: '#64769e', fontWeight: '600' }}>Loading availability...</Text>
      </View>
    );
  }
  
  if (!availability) {
    return (
      <View style={styles.centered}>
    <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.noAvailabilityText}>No availability found.</Text>
      </View>
    );
  }
  
  // Check if after removing booked slots, any slot is left
  const hasSlots = Object.entries(availability).some(([day, times]) => {
    return times.some(time => !isBooked(day, time));
  });
  
  if (!hasSlots) {
    return (
      <View style={styles.centered}>
            <TouchableOpacity
          style={styles.backButton}
         onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.noAvailabilityText}>No availability found.</Text>
      </View>
    );
  }
  
  return (
    
    <View style={styles.screen}>
 


      <ScrollView contentContainerStyle={styles.container}>
        
      <TouchableOpacity
          style={styles.backButton}
           onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Select an Available Slot</Text>

        {Object.entries(availability).map(([day, times]) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day}</Text>
            <View style={styles.slotsContainer}>
              {times.map((time) => {
                if (isBooked(day, time)) return null;

                const isSelected = selected?.day === day && selected?.time === time;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.slot, isSelected && styles.slotSelected]}
                    onPress={() => setSelected({ day, time })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.confirmBtn, bookingLoading && { opacity: 0.7 }]}
          onPress={book}
          disabled={bookingLoading}
          activeOpacity={0.8}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Appointment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#192f6a',
    paddingTop: 50,
  
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    backgroundColor: 'rgba(72, 83, 144, 0.85)', 
    padding: 10,
    borderRadius: 30,
    shadowColor: '#283d89',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  container: {
    paddingHorizontal: 22,
    paddingBottom: 50,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
    textAlign: "center",
    margin:60,
    marginBottom:70,
    marginRight:40,
  },
  daySection: {
    
    marginBottom: 28,
    
  },
  dayTitle: {
    fontSize: 20,
  
    fontWeight: "700",
    marginBottom: 14,
    color: "#92a6e8",
  },
  slotsContainer: {

    flexDirection: "row",
    flexWrap: "wrap",
  },
  slot: {
    backgroundColor: "#3b5998",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  slotSelected: {
    backgroundColor: "#64769e",
    shadowColor: "#64769e",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  slotText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  slotTextSelected: {
    color: "#f0e5ff",
    fontWeight: "700",
  },
  confirmBtn: {
    backgroundColor: "#64769e",
    paddingVertical: 18,
    borderRadius: 28,
    marginTop: 40,
    alignItems: "center",
    shadowColor: "#64769e",
    shadowOpacity: 0.9,
    shadowRadius: 15,
    elevation: 12,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#192f6a',
    padding: 20,
  },
  noAvailabilityText: {
    fontSize: 18,
    color: "#92a6e8",
    fontWeight: "600",
    fontStyle: "italic",
  },
});
