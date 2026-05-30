import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const SCREEN_W = Dimensions.get('window').width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 840 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 18;


export default function Appointment({ route, navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const tailorEmail = route?.params?.email || "tailor@example.com";
  console.log(tailorEmail);
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://tailorx-production.up.railway.app/appointments/tailor-appointments`, {
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
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (String(newStatus).toLowerCase() === "rejected") {
        await axios.delete(`https://tailorx-production.up.railway.app/appointments/delete-appointment/${appointmentId}`);
        Alert.alert("Success", "Appointment rejected and deleted");
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      } else {
        await axios.put(
          `https://tailorx-production.up.railway.app/appointments/update-appointment-status`,
          {
            id: appointmentId,
            status: newStatus,
            tailor_name: appointment?.tailor_name,
            customer_email: appointment?.customer_email
          }
        );
        Alert.alert("Success", `Appointment ${newStatus} successfully`);
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

  const handleDelete = async (appointmentId) => {
    try {
      setUpdating(appointmentId);
      await axios.delete(`https://tailorx-production.up.railway.app/appointments/delete-appointment/${appointmentId}`);
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
      case "pending": return "#F59E0B";
      case "accepted": return "#10B981";
      case "rejected": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "time-outline";
      case "accepted": return "checkmark-circle-outline";
      case "rejected": return "close-circle-outline";
      default: return "help-circle-outline";
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color="#F59E0B" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="calendar" size={22} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.headerSub}>Manage your schedule</Text>
            <Text style={styles.headerTitle}>Appointment Requests</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{appointments.length}</Text>
          </View>
        </View>

        {/* Empty State */}
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={52} color="rgba(148, 163, 184, 0.4)" />
            </View>
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySubText}>When customers book you, they'll appear here</Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>

                {/* Card Top Bar - Status & Delete */}
                <View style={styles.cardTopBar}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '22', borderColor: getStatusColor(appointment.status) + '55' }]}>
                    <Ionicons name={getStatusIcon(appointment.status)} size={13} color={getStatusColor(appointment.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                      {appointment.status?.toUpperCase()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(appointment.id)}
                    disabled={updating === appointment.id}
                    activeOpacity={0.85}
                  >
                    {updating === appointment.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Appointment Details */}
                <View style={styles.appointmentContent}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="person" size={16} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Customer</Text>
                      <Text style={styles.detailValue}>{appointment.customer_email}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="calendar" size={16} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Date & Time</Text>
                      <Text style={styles.detailValue}>{formatDateTime(appointment.datetime)}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {appointment.status?.toLowerCase() === "pending" && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAppointmentStatus(appointment.id, "accepted")}
                        disabled={updating === appointment.id}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.actionBtnGradient}>
                          {updating === appointment.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={17} color="#FFF" />
                              <Text style={styles.buttonText}>Accept</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleAppointmentStatus(appointment.id, "rejected")}
                        disabled={updating === appointment.id}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionBtnGradient}>
                          {updating === appointment.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="close-circle" size={17} color="#FFF" />
                              <Text style={styles.buttonText}>Reject</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 50,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    width: '100%',
  },

  headerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },

  badge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    minWidth: 40,
    alignItems: 'center',
  },
  badgeText: {
    color: "#F59E0B",
    fontWeight: "800",
    fontSize: 15,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#ffffff",
    marginTop: 4,
    fontWeight: '700',
  },
  emptySubText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },

  appointmentsList: {
    gap: 14,
    paddingBottom: 30,
    width: '100%',
  },

  appointmentCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
    width: '100%',
  },

  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    marginHorizontal: 16,
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.4,
  },

  appointmentContent: {
    padding: 16,
    gap: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  detailLabel: {
    fontWeight: "600",
    color: "#94a3b8",
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: '600',
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },

  acceptButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  rejectButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },

  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
