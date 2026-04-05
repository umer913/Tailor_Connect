import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NotificationScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [email])
  );

  const fetchNotifications = async () => {
    if (!email) {
      console.error(`[NOTIFICATION SCREEN] No email provided`);
      return;
    }

    setLoading(true);
    try {
      // Fetch order notifications
      const orderUrl = "http://UF-MacBook-Pro.local:3000/get-notifications";
      const orderResponse = await axios.get(orderUrl, { params: { email } });
      const orderNotifications = (orderResponse.data.notifications || []).map(n => ({
        ...n,
        type: 'order'
      }));

      // Fetch appointment notifications
      const appointmentUrl = "http://UF-MacBook-Pro.local:3000/get-appointment-notifications";
      const appointmentResponse = await axios.get(appointmentUrl, { params: { email } });
      const appointmentNotifications = (appointmentResponse.data.notifications || []).map(n => ({
        ...n,
        type: 'appointment'
      }));

      // Combine and sort by created_at
      const allNotifications = [...orderNotifications, ...appointmentNotifications]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(allNotifications);
    } catch (err) {
      console.error("[NOTIFICATION SCREEN] Error fetching notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const url = "http://UF-MacBook-Pro.local:3000/clear-all-notifications";
      await axios.put(url, { email });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err.message);
    }
  };

  const dismissNotification = async (notificationItem) => {
    try {
      if (notificationItem.type === 'appointment') {
        const url = "http://UF-MacBook-Pro.local:3000/dismiss-appointment-notification";
        await axios.put(url, { appointment_id: notificationItem.id });
      } else {
        const url = "http://UF-MacBook-Pro.local:3000/dismiss-notification";
        await axios.put(url, { order_id: notificationItem.id });
      }
      setNotifications(notifications.filter(n => n.id !== notificationItem.id));
    } catch (err) {
      console.error("Error dismissing notification:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#99aaff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={fetchNotifications} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={24} color="#99aaff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#6fa2ff" />
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.listContainer}>
            {notifications.map((item) => (
              <View key={item.id.toString()} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={styles.tailorInfo}>
                    {item.type === 'appointment' ? (
                      <>
                        <Text style={styles.serviceType}>Appointment with {item.tailor_name}</Text>
                        <Text style={styles.waitingText}>Status: {item.status}</Text>
                        <Text style={styles.waitingText}>Time: {item.datetime}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.serviceType}>{item.service_type} Order from {item.tailor_name}</Text>
                        <Text style={[styles.waitingText, { fontWeight: '600', color: '#FF6B6B' }]}>
                          Status: {item.status?.toUpperCase()}
                        </Text>
                        <Text style={styles.waitingText}>Quantity: {item.quantity}</Text>
                      </>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => dismissNotification(item)}
                  >
                    <Ionicons name="close" size={20} color="#8fa1cc" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={clearAllNotifications}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1435',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 126, 234, 0.15)',
    backgroundColor: 'rgba(38, 52, 90, 0.5)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d1d9ff',
    letterSpacing: 0.8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8fa1cc',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#8fa1cc',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationCard: {
    backgroundColor: 'rgba(38, 52, 90, 0.5)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tailorInfo: {
    flex: 1,
  },
  tailorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#d1d9ff',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 16,
    color: '#8fa1cc',
    fontWeight: '800',
  },
  dismissBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderRadius: 10,
  },
  notificationDetails: {
    gap: 10,
  },
  waitingText: {
    fontSize: 14,
    color: '#ffb366',
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#8fa1cc',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#c3d1ff',
    fontWeight: '700',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.25)',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.4)',
  },
  clearAllText: {
    color: '#ff6699',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default NotificationScreen;
