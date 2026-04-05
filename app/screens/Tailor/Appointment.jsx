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


export default function Appointment({ route, navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const tailorEmail = route?.params?.email || "tailor@example.com";
console.log(tailorEmail);
  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://UF-MacBook-Pro.local:3000/tailor-appointments`, {
        params: { email: tailorEmail }
      });
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId);
      
      // Find the appointment to get details
      const appointment = appointments.find(apt => apt.id === appointmentId);
      // If rejecting, delete the appointment from the database
      if (String(newStatus).toLowerCase() === "rejected") {
        await axios.delete(`http://UF-MacBook-Pro.local:3000/delete-appointment/${appointmentId}`);
        Alert.alert("Success", "Appointment rejected and deleted");
        // Remove from local state
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      } else {
        // Otherwise update status (e.g., accept)
        await axios.put(
          `http://UF-MacBook-Pro.local:3000/update-appointment-status`,
          { 
            id: appointmentId, 
            status: newStatus,
            tailor_name: appointment?.tailor_name,
            customer_email: appointment?.customer_email
          }
        );

        Alert.alert("Success", `Appointment ${newStatus} successfully`);
        // Update local state
        setAppointments(prev => prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      Alert.alert("Error", "Failed to update appointment status");
    } finally {
      setUpdating(null);
    }
  };

  // Delete appointment (calls backend and removes from UI)
  const handleDelete = async (appointmentId) => {
    try {
      setUpdating(appointmentId);
      await axios.delete(`http://UF-MacBook-Pro.local:3000/delete-appointment/${appointmentId}`);
      Alert.alert("Success", "Appointment deleted successfully");
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (error) {
      console.error("Error deleting appointment:", error);
      Alert.alert("Error", "Failed to delete appointment");
    } finally {
      setUpdating(null);
    }
  };
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FFA500";
      case "accepted":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      default:
        return "#666";
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2B0F14" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#2B0F14', '#3A1419', '#4A1C22']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#E6B0B0" />
        </TouchableOpacity>

        {/* Header */}
        
        <View style={styles.header}>
          <Ionicons name="calendar" size={28} color="#E6B0B0" />
          <Text style={styles.headerTitle}>Appointment Requests</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{appointments.length}</Text>
          </View>
        </View>

        {/* Empty State */}
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#E6B0B0" />
            <Text style={styles.emptyText}>No appointments yet</Text>
          </View>
        ) : (
          /* Appointments List */
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(appointment.id)}
                  disabled={updating === appointment.id}
                >
                  {updating === appointment.id ? (
                    <ActivityIndicator size="small" color="#4A1C22" />
                  ) : (
                    <Ionicons name="close" size={18} color="#4A1C22" />
                  )}
                </TouchableOpacity>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <Text style={styles.statusText}>{appointment.status?.toUpperCase()}</Text>
                </View>

                {/* Appointment Details */}
                <View style={styles.appointmentContent}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={18} color="#E6B0B0" />
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailValue}>{appointment.customer_email}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={18} color="#E6B0B0" />
                    <Text style={styles.detailLabel}>Date & Time:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(appointment.datetime)}</Text>
                  </View>

                  {/* Action Buttons - Only show if pending */}
                  {appointment.status?.toLowerCase() === "pending" && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => handleAppointmentStatus(appointment.id, "accepted")}
                        disabled={updating === appointment.id}
                      >
                        {updating === appointment.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                            <Text style={styles.buttonText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleAppointmentStatus(appointment.id, "rejected")}
                        disabled={updating === appointment.id}
                      >
                        {updating === appointment.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="close-circle" size={18} color="#FFF" />
                            <Text style={styles.buttonText}>Reject</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Refresh Button */}
      
     
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#2B0F14',
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(230, 176, 176, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 58,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F2E6E6",
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    backgroundColor: "#E6B0B0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#4A1C22",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#E6B0B0",
    marginTop: 16,
  },
  appointmentsList: {
    gap: 16,
    paddingBottom: 80,
  },
  appointmentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#ffffff",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E6B0B0',
    padding: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  },
  appointmentContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#000000",
    fontSize: 14,
    minWidth: 70,
  },
  detailValue: {
    color: "#000000",
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  Button: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#7A1F2B",
    borderRadius: 50,
    width: 56,
    refreshheight: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
