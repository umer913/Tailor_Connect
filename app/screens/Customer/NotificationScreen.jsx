import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TYPE_CONFIG = {
  appointment: { icon: 'calendar', gradient: ['#9D2A4B', '#5c1428'], label: 'Appointment' },
  order: { icon: 'receipt', gradient: ['#D6406A', '#9D2A4B'], label: 'Order' },
};

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#10b981',
  completed: '#06b6d4',
  in_progress: '#8b5cf6',
  rejected: '#ef4444',
  cancelled: '#ef4444',
};

const NotificationScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  useFocusEffect(
    React.useCallback(() => { fetchNotifications(); }, [email])
  );

  const fetchNotifications = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const orderRes = await axios.get("https://tailorx-production.up.railway.app/notifications/get-notifications", { params: { email } });
      const orderNotifs = (orderRes.data.notifications || []).map(n => ({ ...n, type: 'order' }));

      const apptRes = await axios.get("https://tailorx-production.up.railway.app/notifications/get-appointment-notifications", { params: { email } });
      const apptNotifs = (apptRes.data.notifications || []).map(n => ({ ...n, type: 'appointment' }));

      const all = [...orderNotifs, ...apptNotifs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(all);
    } catch (err) {
      console.error("[NOTIFICATION SCREEN] Error:", err.message);
    } finally { setLoading(false); }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.put("https://tailorx-production.up.railway.app/notifications/clear-all-notifications", { email });
      setNotifications([]);
    } catch (err) { console.error("Error clearing notifications:", err.message); }
  };

  const dismissNotification = async (item) => {
    try {
      if (item.type === 'appointment') {
        await axios.put("https://tailorx-production.up.railway.app/notifications/dismiss-appointment-notification", { appointment_id: item.id });
      } else {
        await axios.put("https://tailorx-production.up.railway.app/notifications/dismiss-notification", { order_id: item.id });
      }
      setNotifications(notifications.filter(n => n.id !== item.id));
    } catch (err) { console.error("Error dismissing notification:", err.message); }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const statusColor = (s) => STATUS_COLORS[(s || '').toLowerCase()] || '#E6B0B0';

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{notifications.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={fetchNotifications} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#E6B0B0" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Fetching notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <LinearGradient colors={["rgba(157,42,75,0.25)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconWrap}>
            <Ionicons name="checkmark-circle-outline" size={42} color="#E6B0B0" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No new notifications at the moment</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {notifications.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.order;
              const sc = statusColor(item.status);
              return (
                <View key={String(item.id)} style={styles.card}>
                  {/* left accent */}
                  <LinearGradient colors={cfg.gradient} style={styles.cardBar} />

                  <View style={styles.cardBody}>
                    {/* icon + title row */}
                    <View style={styles.cardTop}>
                      <LinearGradient colors={cfg.gradient} style={styles.iconWrap}>
                        <Ionicons name={cfg.icon} size={16} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        {item.type === 'appointment' ? (
                          <Text style={styles.cardTitle}>Appointment with {item.tailor_name}</Text>
                        ) : (
                          <Text style={styles.cardTitle}>{item.service_type} Order</Text>
                        )}
                        <Text style={styles.cardTailorSub}>
                          {item.type === 'order' ? `from ${item.tailor_name}` : cfg.label}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.dismissBtn} onPress={() => dismissNotification(item)}>
                        <Ionicons name="close" size={16} color="#ffffffff" />
                      </TouchableOpacity>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsRow}>
                      <View style={[styles.statusPill, { backgroundColor: `${sc}22`, borderColor: `${sc}44` }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc }]} />
                        <Text style={[styles.statusPillText, { color: sc }]}>
                          {(item.status || '').toUpperCase()}
                        </Text>
                      </View>

                      {item.type === 'appointment' && item.datetime && (
                        <Text style={styles.timeText}>{formatTime(item.datetime)}</Text>
                      )}
                      {item.type === 'order' && item.quantity != null && (
                        <Text style={styles.timeText}>Qty: {item.quantity}</Text>
                      )}
                    </View>

                    {item.created_at && (
                      <Text style={styles.createdAt}>{formatTime(item.created_at)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllNotifications}>
              <Ionicons name="trash-outline" size={18} color="#f87171" style={{ marginRight: 8 }} />
              <Text style={styles.clearAllText}>Clear All Notifications</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: 16,
    paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,176,176,0.08)',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(157,42,75,0.15)',
    borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  countBadge: {
    marginLeft: 8, backgroundColor: '#9D2A4B',
    borderRadius: 10, minWidth: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(157,42,75,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingDot: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(157,42,75,0.2)', marginBottom: 14,
  },
  loadingText: { color: '#E6B0B0', fontSize: 15, fontWeight: '600' },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(157,42,75,0.3)',
  },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: '#E6B0B0', fontSize: 15, fontWeight: '600' },
  listContainer: { flex: 1, paddingHorizontal: PAGE_GUTTER, paddingTop: 16, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(26, 6, 16, 0.45)',
    borderWidth: 1, borderColor: 'rgba(157,42,75,0.18)',
    overflow: 'hidden',
    shadowColor: '#9D2A4B',
    shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardTailorSub: { color: '#E6B0B0', fontSize: 12, fontWeight: '600', marginTop: 1 },
  dismissBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 1)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  timeText: { color: '#E6B0B0', fontSize: 12, fontWeight: '600' },
  createdAt: { color: '#E6B0B0', fontSize: 11, marginTop: 6, fontWeight: '500' },
  footer: { padding: 16, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  clearAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  clearAllText: { color: '#f87171', fontSize: 15, fontWeight: '700' },
});

export default NotificationScreen;
