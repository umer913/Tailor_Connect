import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, resolveImageUrl } from '../../api.js';

const SCREEN_W = Dimensions.get('window').width;
const IS_WEB = Platform.OS === 'web';
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 860 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 18;

export default function MyOrders({ route, navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Cross-platform description prompt (replaces Alert.prompt which is iOS-only)
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [descModalText, setDescModalText] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState(null); // { orderId, newStatus }
  const tailorEmail = route?.params?.email || 'tailor@example.com';

  const completedCount = orders.filter(o => String(o.status || '').toLowerCase() === 'completed').length;
  const paidCount = orders.filter(o => String(o.status || '').toLowerCase() === 'paid').length;

  const getExpandedOrder = () => orders.find(o => o.id === expandedOrderId);

  const parseNumericPrice = (rawPrice) => {
    const firstMatch = String(rawPrice || '').match(/\d+(?:\.\d+)?/);
    return firstMatch ? Number.parseFloat(firstMatch[0]) : 0;
  };

  const toSafeQuantity = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const formatCurrency = (value) => {
    if (!Number.isFinite(value)) return '0';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  };

  const getOrderPricing = (order) => {
    const quantity = toSafeQuantity(order?.quantity);
    const options = order?.options && typeof order.options === 'object' ? order.options : {};
    const metaUnitPrice = Number(options.__unit_price);
    const basePrice = parseNumericPrice(order?.price);
    const hasUnitMeta = Number.isFinite(metaUnitPrice) && metaUnitPrice > 0;
    const unitPrice = hasUnitMeta ? metaUnitPrice : basePrice;
    const totalPrice = hasUnitMeta && options.__price_mode === 'total' && basePrice > 0
      ? basePrice
      : Number((unitPrice * quantity).toFixed(2));

    return { quantity, unitPrice, totalPrice };
  };

  const getVisibleOptions = (options) => {
    if (!options || typeof options !== 'object') return {};
    return Object.fromEntries(Object.entries(options).filter(([key]) => !String(key).startsWith('__')));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const FILTER_OPTIONS = [
    { label: 'All Orders', value: 'all', icon: 'list-outline', color: '#60A5FA' },
    { label: 'New Orders', value: 'accepted', icon: 'sparkles-outline', color: '#34D399' },
    { label: 'Pending', value: 'pending', icon: 'time-outline', color: '#FBBF24' },
    { label: 'In Progress', value: 'in_progress', icon: 'play-circle-outline', color: '#818CF8' },
    { label: 'Paid', value: 'paid', icon: 'card-outline', color: '#10B981' },
  ];

  const activeFilterOption = FILTER_OPTIONS.find(f => f.value === statusFilter) || FILTER_OPTIONS[0];

  const displayedOrders = orders
    .filter(o => {
      if (statusFilter !== 'all' && (o.status || '').toLowerCase() !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const emailMatch = (o.customer_email || '').toLowerCase().includes(q);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
        return emailMatch || nameMatch;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/orders/tailor-orders`, {
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

  const handleChangeStatus = (orderId, newStatus) => {
    // Store pending change and open the description modal (Alert.prompt is iOS-only)
    setPendingStatusChange({ orderId, newStatus });
    setDescModalText('');
    setDescModalVisible(true);
  };

  const confirmStatusChange = async () => {
    if (!descModalText.trim()) {
      Alert.alert('Description Required', 'Please enter a message for this status change.');
      return;
    }
    if (!pendingStatusChange) return;

    const { orderId, newStatus } = pendingStatusChange;
    setDescModalVisible(false);
    setPendingStatusChange(null);

    try {
      setUpdating(orderId);
      await axios.put(`${API_BASE_URL}/orders/update-order-status`, {
        id: orderId,
        status: newStatus,
        description: descModalText.trim(),
      });

      if (String(newStatus).toLowerCase() === 'cancelled' || String(newStatus).toLowerCase() === 'rejected') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        Alert.alert('Success', 'Order removed');
      } else {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus, description: descModalText.trim() } : o
        ));
        Alert.alert('Success', `Order status set to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(null);
      setDescModalText('');
    }
  };

  const handleDelete = async (orderId) => {
    try {
      setUpdating(orderId);
      await axios.delete(`${API_BASE_URL}/orders/delete-order/${orderId}`);
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
      <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={{ color: '#94a3b8', marginTop: 14, fontSize: 14, fontWeight: '600' }}>Loading orders...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.container}>
      {/* Back Button */}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#F59E0B" />
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>

              <Text style={styles.headerTitle}>My Orders</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{orders.length}</Text>
            </View>
          </View>
          <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
            <Text style={styles.headerStats}>{completedCount} Completed • {paidCount} Paid</Text>
          </LinearGradient>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name or email…"
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── DROPDOWN FILTER ── */}
        <View style={styles.filterWrapper}>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.85}
          >
            <View style={styles.filterDropdownLeft}>
              <View style={[styles.filterDot, { backgroundColor: activeFilterOption.color }]} />
              <Text style={styles.filterDropdownText}>{activeFilterOption.label}</Text>
            </View>
            <View style={styles.filterCountWrap}>
              <Text style={styles.filterCountText}>{displayedOrders.length}</Text>
            </View>
            <Ionicons
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#94a3b8"
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.filterDropdownMenu}>
              {FILTER_OPTIONS.map((opt) => {
                const isActive = statusFilter === opt.value;
                const count = opt.value === 'all'
                  ? orders.length
                  : orders.filter(o => (o.status || '').toLowerCase() === opt.value).length;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.filterMenuItem, isActive && styles.filterMenuItemActive]}
                    onPress={() => { setStatusFilter(opt.value); setDropdownOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={opt.icon} size={16} color={isActive ? opt.color : '#64748b'} />
                    <Text style={[styles.filterMenuText, isActive && { color: opt.color }]}>{opt.label}</Text>
                    <View style={[styles.filterMenuCount, isActive && { backgroundColor: `${opt.color}20`, borderColor: `${opt.color}40` }]}>
                      <Text style={[styles.filterMenuCountText, isActive && { color: opt.color }]}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="basket-outline" size={80} color="#94a3b8" />
            </View>
            <Text style={styles.emptyText}>No Orders Yet</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {displayedOrders.map(order => {
              const pricing = getOrderPricing(order);
              const statusLower = String(order.status || '').toLowerCase();
              const canRemoveOrder = statusLower === 'paid';

              return (
                <TouchableOpacity key={order.id} activeOpacity={0.9} onPress={() => setExpandedOrderId(order.id)}>
                  <LinearGradient colors={['rgba(15, 23, 42, 0.65)', 'rgba(11, 18, 32, 0.85)']} style={styles.card}>
                    {/* Delete Button */}
                    {canRemoveOrder && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Order',
                            'Are you sure you want to remove this order?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => handleDelete(order.id),
                              },
                            ]
                          );
                        }}
                        disabled={updating === order.id}
                      >
                        {updating === order.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Fabric Image */}
                    <View style={styles.fabricContainer}>
                      {order.fabric_image_url ? (
                        <Image
                          source={{ uri: resolveImageUrl(order.fabric_image_url) }}
                          style={styles.fabricImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.fabricPlaceholder}>
                          <Ionicons name="image-outline" size={40} color="#94a3b8" />
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

                    {/* Placed-on date label */}
                    <View style={styles.placedOnRow}>
                      <Ionicons name="calendar-outline" size={14} color="#64748b" />
                      <Text style={styles.placedOnText}>
                        Placed on {formatDate(order.created_at || order.createdAt)}
                      </Text>
                    </View>

                    {/* Order Details */}
                    <View style={styles.content}>
                      {/* Customer Info */}
                      <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                          <Ionicons name="person-circle-outline" size={20} color="#F59E0B" />
                          <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Customer</Text>
                            {order.customer_name ? (
                              <Text style={styles.infoValue} numberOfLines={1}>{order.customer_name}</Text>
                            ) : null}
                            <Text style={[styles.infoValue, styles.infoValueMuted]} numberOfLines={1}>{order.customer_email}</Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <Ionicons name="copy-outline" size={20} color="#F59E0B" />
                          <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Service Type</Text>
                            <Text style={styles.infoValue}>{order.service_type}</Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <Ionicons name="shirt-outline" size={20} color="#F59E0B" />
                          <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Gender</Text>
                            <Text style={styles.infoValue}>{order.gender || 'N/A'}</Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
                          <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Quantity</Text>
                            <Text style={styles.infoValue}>{pricing.quantity}</Text>
                          </View>
                        </View>
                        {order.description && order.description.trim() !== '' && (
                          <View style={styles.infoRow}>
                            <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
                            <View style={styles.infoText}>
                              <Text style={styles.infoLabel}>Description</Text>
                              <Text style={styles.infoValue}>{order.description}</Text>
                            </View>
                          </View>
                        )}
                        {pricing.totalPrice > 0 && (
                          <View style={styles.infoRow}>
                            <Ionicons name="pricetag-outline" size={20} color="#F59E0B" />
                            <View style={styles.infoText}>
                              <Text style={styles.infoLabel}>Unit Price</Text>
                              <Text style={styles.infoValue}>Rs. {formatCurrency(pricing.unitPrice)}</Text>
                            </View>
                          </View>
                        )}

                        {pricing.totalPrice > 0 && (
                          <View style={styles.infoRow}>
                            <Ionicons name="cash-outline" size={20} color="#F59E0B" />
                            <View style={styles.infoText}>
                              <Text style={styles.infoLabel}>Total Price</Text>
                              <Text style={styles.infoValue}>Rs. {formatCurrency(pricing.totalPrice)}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <View style={styles.infoRow}>
                        <View style={styles.infoText}>
                          <Text style={styles.infoLabel}>Order ID</Text>
                          <Text style={styles.infoValue} numberOfLines={1}>{order.id}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copyIdBtn}
                          onPress={async () => {
                            await Clipboard.setStringAsync(String(order.id));
                            Alert.alert('Copied!', `Order ID ${order.id} copied to clipboard.`);
                          }}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="copy-outline" size={14} color="#fff" />
                          <Text style={styles.copyIdText}>Copy ID</Text>
                        </TouchableOpacity>
                      </View>
                      {/* Action Buttons */}
                      {!['paid', 'completed', 'cancelled', 'rejected'].includes(statusLower) && (
                        <View style={styles.actionsContainer}>
                          <View style={styles.actionsRow}>
                            {statusLower !== 'accepted' && (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.acceptBtn]}
                                onPress={() => handleChangeStatus(order.id, 'accepted')}
                                disabled={updating === order.id}
                              >
                                <Ionicons name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Accept</Text>
                              </TouchableOpacity>
                            )}

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
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
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
                    <Ionicons name="close-circle" size={28} color="#F59E0B" />
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
                  {Object.keys(getVisibleOptions(getExpandedOrder().options)).length > 0 ? (
                    <View style={styles.modalSection}>
                      <View style={styles.sectionHeaderBox}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>Options</Text>
                      </View>
                      <View style={styles.optionsContainer}>
                        {Object.entries(getVisibleOptions(getExpandedOrder().options)).map(([key, value]) => (
                          <View key={key} style={styles.optionRow}>
                            <Ionicons name="checkmark-done" size={16} color="#10B981" />
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

      {/* ── Description prompt modal (cross-platform replacement for Alert.prompt) ── */}
      <Modal visible={descModalVisible} transparent animationType="fade" onRequestClose={() => { setDescModalVisible(false); setPendingStatusChange(null); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Status Update</Text>
              <TouchableOpacity onPress={() => { setDescModalVisible(false); setPendingStatusChange(null); }}>
                <Ionicons name="close-circle" size={28} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
              Enter a message / description for this status change:
            </Text>
            <TextInput
              style={[styles.searchInput, { borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 10, padding: 10, minHeight: 70, textAlignVertical: 'top', color: '#fff', backgroundColor: 'rgba(15,23,42,0.8)', marginBottom: 16 }]}
              placeholder="e.g. Stitching started, will be ready in 3 days..."
              placeholderTextColor="#475569"
              value={descModalText}
              onChangeText={setDescModalText}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelBtn, { flex: 1, justifyContent: 'center' }]}
                onPress={() => { setDescModalVisible(false); setPendingStatusChange(null); setDescModalText(''); }}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptBtn, { flex: 1, justifyContent: 'center' }]}
                onPress={confirmStatusChange}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionText}>Confirm</Text>
              </TouchableOpacity>
            </View>
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
    case 'paid':
      return '#4CAF50';
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
    case 'paid':
      return '#6EE7B7';
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
    case 'paid':
      return 'card-outline';
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
  },
  scrollContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 12,
    paddingBottom: 40,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 24,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    minWidth: 38,
    alignItems: 'center',
  },
  badgeText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 14,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  headerStats: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Search bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },

  // ── Dropdown filter ──
  filterWrapper: {
    marginBottom: 16,
    zIndex: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  filterDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterDropdownText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  filterCountWrap: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  filterCountText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
  },
  filterDropdownMenu: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.08)',
  },
  filterMenuItemActive: {
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  filterMenuText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  filterMenuCount: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterMenuCountText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Placed on label ──
  placedOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  placedOnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 40,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.12)',
  },
  emptyText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 19,
  },
  list: {
    gap: 14,
    paddingBottom: 20,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  fabricContainer: {
    height: 190,
    backgroundColor: '#0f172a',
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
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 13,
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
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
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  copyIdText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
  infoValueMuted: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  acceptBtn: { backgroundColor: '#10B981' },
  inprogressBtn: { backgroundColor: '#3B82F6' },
  completeBtn: { backgroundColor: '#8B5CF6' },
  cancelBtn: { backgroundColor: '#EF4444' },
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#0b1220',
    borderRadius: 26,
    maxHeight: IS_WEB ? '82%' : '85%',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: IS_WEB ? 24 : 18,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.15)',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalScroll: {
    paddingBottom: 30,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.15)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  noDataText: {
    fontSize: 13,
    color: '#94a3b8',
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
    width: SCREEN_W >= 1024 ? '31%' : SCREEN_W >= 768 ? '48%' : '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  measurementLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  optionsContainer: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.07)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  optionValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
});
