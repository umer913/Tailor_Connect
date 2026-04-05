import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MyOrders({ route, navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const tailorEmail = route?.params?.email || 'tailor@example.com';

  const getExpandedOrder = () => orders.find(o => o.id === expandedOrderId);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://UF-MacBook-Pro.local:3000/tailor-orders', {
        params: { email: tailorEmail },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await axios.put('http://UF-MacBook-Pro.local:3000/update-order-status', {
        id: orderId,
        status: newStatus,
      });

      // If backend deleted the order for cancelled/rejected, remove locally
      if (String(newStatus).toLowerCase() === 'cancelled' || String(newStatus).toLowerCase() === 'rejected') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        Alert.alert('Success', 'Order removed');
      } else {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
        Alert.alert('Success', `Order status set to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      setUpdating(orderId);
      await axios.delete(`http://UF-MacBook-Pro.local:3000/delete-order/${orderId}`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      Alert.alert('Success', 'Order deleted');
    } catch (err) {
      console.error('Error deleting order:', err);
      Alert.alert('Error', 'Failed to delete order');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#2B0F14", "#3A1419", "#4A1C22"]} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E6B0B0" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a0a0f", "#2B0F14", "#3A1419"]} style={styles.container}>
     {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#E6B0B0" />
            </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerSubtitle}>Your Tasks</Text>
              <Text style={styles.headerTitle}>My Orders</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{orders.length}</Text>
            </View>
          </View>
          <LinearGradient colors={['#E6B0B0', '#D4999B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
            <Text style={styles.headerStats}>{orders.filter(o => o.status === 'completed').length} Completed</Text>
          </LinearGradient>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="basket-outline" size={80} color="#E6B0B0" />
            </View>
            <Text style={styles.emptyText}>No Orders Yet</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {orders.map(order => (
              <TouchableOpacity key={order.id} activeOpacity={0.9} onPress={() => setExpandedOrderId(order.id)}>
                <LinearGradient colors={['#ffffff', '#f8f0f0']} style={styles.card}>
                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(order.id)}
                  disabled={updating === order.id}
                >
                  {updating === order.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="close-circle" size={24} color="#E74C3C" />
                  )}
                </TouchableOpacity>

                {/* Fabric Image */}
                <View style={styles.fabricContainer}>
                  {order.fabric_image_url ? (
                    <Image 
                      source={{ uri: order.fabric_image_url }} 
                      style={styles.fabricImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient colors={['#E6B0B0', '#D4999B']} style={styles.fabricPlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#fff" />
                      <Text style={styles.noImageText}>No Fabric Image</Text>
                    </LinearGradient>
                  )}
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                  <LinearGradient 
                    colors={[getStatusColor(order.status), getStatusColorLight(order.status)]} 
                    style={styles.statusBadge}
                  >
                    <Ionicons name={getStatusIcon(order.status)} size={14} color="#fff" />
                    <Text style={styles.statusText}>{order.status?.toUpperCase()}</Text>
                  </LinearGradient>
                </View>

                {/* Order Details */}
                <View style={styles.content}>
                  {/* Customer Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-circle-outline" size={20} color="#E6B0B0" />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Customer</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{order.customer_email}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="copy-outline" size={20} color="#E6B0B0" />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Service Type</Text>
                        <Text style={styles.infoValue}>{order.service_type}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="shirt-outline" size={20} color="#E6B0B0" />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Gender</Text>
                        <Text style={styles.infoValue}>{order.gender || 'N/A'}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="document-text-outline" size={20} color="#E6B0B0" />
                      <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Quantity</Text>
                        <Text style={styles.infoValue}>{order.quantity}</Text>
                      </View>
                    </View>

                    {order.price && (
                      <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={20} color="#E6B0B0" />
                        <View style={styles.infoText}>
                          <Text style={styles.infoLabel}>Price</Text>
                          <Text style={styles.infoValue}>Rs. {order.price}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptBtn]}
                        onPress={() => handleChangeStatus(order.id, 'accepted')}
                        disabled={updating === order.id}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.actionText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.inprogressBtn]}
                        onPress={() => handleChangeStatus(order.id, 'in_progress')}
                        disabled={updating === order.id}
                      >
                        <Ionicons name="play-circle-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Progress</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeBtn]}
                        onPress={() => handleChangeStatus(order.id, 'completed')}
                        disabled={updating === order.id}
                      >
                        <Ionicons name="checkmark-done" size={16} color="#fff" />
                        <Text style={styles.actionText}>Complete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelBtn]}
                        onPress={() => handleChangeStatus(order.id, 'cancelled')}
                        disabled={updating === order.id}
                      >
                        <Ionicons name="ban" size={16} color="#fff" />
                        <Text style={styles.actionText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

    

      {/* Measurements & Options Modal */}
      <Modal visible={expandedOrderId !== null} transparent animationType="slide" onRequestClose={() => setExpandedOrderId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {getExpandedOrder() && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order Details</Text>
                  <TouchableOpacity onPress={() => setExpandedOrderId(null)}>
                    <Ionicons name="close-circle" size={28} color="#E6B0B0" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  {/* Measurements */}
                  {getExpandedOrder().measurements && Object.keys(getExpandedOrder().measurements).length > 0 ? (
                    <View style={styles.modalSection}>
                      <View style={styles.sectionHeaderBox}>
                       
                        <Text style={styles.sectionTitle}>Measurements</Text>
                      </View>
                      <View style={styles.measurementsGrid}>
                        {Object.entries(getExpandedOrder().measurements).map(([key, value]) => (
                          <View key={key} style={styles.measurementCard}>
                            <Text style={styles.measurementLabel}>{key.replace(/_/g, ' ')}</Text>
                            <Text style={styles.measurementValue}>{value} cm</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalSection}>
                      <Text style={styles.noDataText}>No measurements provided</Text>
                    </View>
                  )}

                  {/* Options */}
                  {getExpandedOrder().options && Object.keys(getExpandedOrder().options).length > 0 ? (
                    <View style={styles.modalSection}>
                      <View style={styles.sectionHeaderBox}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.sectionTitle}>Options</Text>
                      </View>
                      <View style={styles.optionsContainer}>
                        {Object.entries(getExpandedOrder().options).map(([key, value]) => (
                          <View key={key} style={styles.optionRow}>
                            <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
                            <View style={styles.optionText}>
                              <Text style={styles.optionLabel}>{key.replace(/_/g, ' ')}</Text>
                              <Text style={styles.optionValue}>{String(value)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalSection}>
                     
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return '#FF9800';
    case 'accepted':
      return '#4CAF50';
    case 'in_progress':
      return '#2196F3';
    case 'completed':
      return '#7B2E8E';
    case 'cancelled':
    case 'rejected':
      return '#E74C3C';
    default:
      return '#95A5A6';
  }
};

const getStatusColorLight = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return '#FFB74D';
    case 'accepted':
      return '#66BB6A';
    case 'in_progress':
      return '#42A5F5';
    case 'completed':
      return '#9C3BA8';
    case 'cancelled':
    case 'rejected':
      return '#E8725C';
    default:
      return '#AEB6B8';
  }
};

const getStatusIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'time-outline';
    case 'accepted':
      return 'checkmark-circle-outline';
    case 'in_progress':
      return 'radio-button-on';
    case 'completed':
      return 'checkmark-done-outline';
    case 'cancelled':
    case 'rejected':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingTop: 12,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContainer: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E6B0B0',
    fontWeight: '500',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F0F0F0',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#E6B0B0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#E6B0B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    color: '#2B0F14',
    fontWeight: '800',
    fontSize: 16,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(230, 176, 176, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  headerStats: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconBox: {
    backgroundColor: 'rgba(230, 176, 176, 0.1)',
    borderRadius: 80,
    padding: 30,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    color: '#E6B0B0',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0A0A0',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabricContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  fabricImage: {
    width: '100%',
    height: '100%',
  },
  fabricPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noImageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoSection: {
    gap: 10,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#2B0F14',
    fontWeight: '700',
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  actionsContainer: {
    gap: 8,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  inprogressBtn: {
    backgroundColor: '#2196F3',
  },
  completeBtn: {
    backgroundColor: '#7B2E8E',
  },
  cancelBtn: {
    backgroundColor: '#E74C3C',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B0F14',
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E6B0B0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B0F14',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  measurementCard: {
    width: '48%',
    backgroundColor: '#f8f0f0',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E6B0B0',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E6B0B0',
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f0f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  optionValue: {
    fontSize: 14,
    color: '#2B0F14',
    fontWeight: '700',
  },
});
