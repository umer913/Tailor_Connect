import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { resolveImageUrl } from "../../api.js";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const API_BASE_URL = "https://tailorconnect-production.up.railway.app";
const { width: SCREEN_W } = Dimensions.get("window");
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

const STATUS_CONFIG = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" },
  accepted: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)" },
  in_progress: { color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)" },
  completed: { color: "#06b6d4", bg: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.35)" },
  paid: { color: "#22c55e", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.35)" },
};

const getStatusCfg = (s) => STATUS_CONFIG[(s || "").toLowerCase()] || { color: "#818cf8", bg: "rgba(79,70,229,0.1)", border: "rgba(79,70,229,0.3)" };

export default function CustomerOrders({ route }) {
  const navigation = require("@react-navigation/native").useNavigation();
  const CustomerEmail = route?.params?.CustomerEmail || "";

  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedMeasurements, setEditedMeasurements] = useState({});
  const [editedQuantity, setEditedQuantity] = useState({});
  const [editedImages, setEditedImages] = useState({});
  const [paymentStatusMap, setPaymentStatusMap] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [reviewedTailors, setReviewedTailors] = useState({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDescription, setReviewDescription] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { useFocusEffect } = require("@react-navigation/native");
  const ImagePicker = require("expo-image-picker");
  const Clipboard = require("expo-clipboard");

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/orders/get-orders`, { params: { email: CustomerEmail } });
      const orderList = data.orders || [];
      setOrders(orderList);
      try {
        const ids = orderList.map((o) => o.id).filter(Boolean);
        if (ids.length) {
          const statusRes = await axios.get(`${API_BASE_URL}/payments/status`, { params: { order_ids: ids.join(",") } });
          setPaymentStatusMap(statusRes?.data?.statuses || {});
        } else { setPaymentStatusMap({}); }
      } catch { setPaymentStatusMap({}); }
      try {
        const reviewRes = await axios.get(`${API_BASE_URL}/reviews/customer-reviews`, { params: { customer_id: CustomerEmail } });
        const reviewList = reviewRes?.data?.reviews || [];
        const reviewMap = reviewList.reduce((acc, review) => {
          if (!review?.tailor_id) {
            return acc;
          }
          acc[review.tailor_id] = { rating: review.rating, order_id: review.order_id };
          return acc;
        }, {});
        setReviewedTailors(reviewMap);
      } catch {
        setReviewedTailors({});
      }
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err) { console.log(err); }
  }, [CustomerEmail, fadeAnim]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const pickImage = async (orderId) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled) setEditedImages((prev) => ({ ...prev, [orderId]: res.assets[0] }));
  };

  const saveChanges = async (order) => {
    try {
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("measurements", JSON.stringify(editedMeasurements[order.id] || order.measurements));
      formData.append("quantity", editedQuantity[order.id] || order.quantity);
      if (editedImages[order.id]) {
        formData.append("fabric", { uri: editedImages[order.id].uri, name: "fabric.jpg", type: "image/jpeg" });
      }
      await axios.put("https://tailorconnect-production.up.railway.app/orders/update-order", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Success", "Order updated successfully");
      setEditingId(null);
      fetchOrders();
    } catch (err) { console.log("Update failed", err); }
  };

  const deleteOrder = (id) => {
    Alert.alert("Delete Order", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await axios.delete(`https://tailorconnect-production.up.railway.app/orders/delete-order/${id}`);
          Alert.alert("Success", "Order deleted");
          setOrders((prev) => prev.filter((o) => o.id !== id));
        },
      },
    ]);
  };

  const openReviewModal = (order) => {
    setReviewOrder(order);
    setReviewRating(0);
    setReviewDescription("");
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewOrder) {
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert("Rating required", "Please select a rating from 1 to 5.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await axios.post(`${API_BASE_URL}/reviews/tailor-reviews`, {
        tailor_id: reviewOrder.tailor_email,
        customer_id: CustomerEmail,
        rating: reviewRating,
        description: reviewDescription,
        order_id: reviewOrder.id,
      });
      setReviewedTailors((prev) => ({
        ...prev,
        [reviewOrder.tailor_email]: { rating: reviewRating, order_id: reviewOrder.id },
      }));
      setReviewModalVisible(false);
      Alert.alert("Thank you!", "Your review has been submitted.");
    } catch (err) {
      console.log("Review failed", err);
      Alert.alert("Error", "Could not submit your review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.heading}>My Orders</Text>
          <Text style={styles.headerSub}>{orders.length} order{orders.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Ionicons name="refresh-outline" size={20} color="#E6B0B0" />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <LinearGradient colors={["rgba(157,42,75,0.25)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconWrap}>
            <Ionicons name="receipt-outline" size={40} color="#E6B0B0" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your placed orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isOpen = expandedId === item.id;
            const isCompleted = (item.status || "").toLowerCase() === "completed";
            const paymentStatus = paymentStatusMap[String(item.id)] || "unpaid";
            const isOrderPaid = paymentStatus === "paid";
            const canEdit = !isCompleted && !isOrderPaid;
            const isEditing = editingId === item.id && canEdit;
            const displayStatus = isCompleted && isOrderPaid ? "paid" : item.status;
            const statusCfg = getStatusCfg(displayStatus);
            const existingReview = reviewedTailors[item.tailor_email];
            const canReview = isOrderPaid && !existingReview;

            return (
              <AnimatedPressable
                onPress={() => setExpandedId(isOpen ? null : item.id)}
                style={[styles.card, { opacity: fadeAnim }]}
              >
                {/* Top accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: statusCfg.color }]} />

                <View style={styles.cardInner}>
                  {/* Header row */}
                  <View style={styles.rowBetween}>
                    <Text style={styles.service} numberOfLines={1}>{item.service_type}</Text>
                    <View style={styles.rightHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>{String(displayStatus || "").toUpperCase()}</Text>
                      </View>
                      <Pressable style={styles.closeBtn} onPress={() => deleteOrder(item.id)}>
                        <Ionicons name="trash-outline" size={14} color="#f87171" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.orderIdRow}>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => { Clipboard.setStringAsync(item.id.toString()); Alert.alert("Copied", "Order ID copied"); }}
                    >
                      <Ionicons name="copy-outline" size={15} color="#E6B0B0" />
                    </TouchableOpacity>
                    <Text style={styles.orderIdText} numberOfLines={1}>ID: {item.id}</Text>
                  </View>
                  {/* Info rows */}
                  <View style={styles.infoRowWrap}>
                    <Ionicons style={{ marginLeft: 3 }} name="cut-outline" size={17} color="#E6B0B0" />
                    <Text style={styles.infoText}>Tailor: {item.tailor_name}</Text>
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoGridLabel}>QUANTITY</Text>
                      <Text style={styles.infoGridValue}>{item.quantity}</Text>
                    </View>
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoGridLabel}>PRICE</Text>
                      <Text style={styles.infoGridValue}>{item.price}</Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text style={{ color: "#f59e0b", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>Tailor description:</Text>
                  ) : null}
                  {item.description ? (

                    <Text style={styles.descText} numberOfLines={isOpen ? undefined : 1}>{item.description}</Text>

                  ) : null}

                  {/* Payment row for completed + unpaid orders */}
                  {isCompleted && !isOrderPaid && (
                    <View style={styles.paymentRow}>
                      <View style={[styles.paymentPill, { backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.4)" }]}>
                        <Ionicons name="time" size={14} color="#f59e0b" />
                        <Text style={[styles.paymentStatus, { color: "#f59e0b" }]}>Payment Due</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => navigation.navigate("Payment", { orderId: item.id, CustomerEmail })}
                      >
                        <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.payNowGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Ionicons name="card-outline" size={14} color="#fff" style={{ marginRight: 5 }} />
                          <Text style={styles.payNowText}>Pay Now</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isOrderPaid ? (
                    existingReview ? (
                      <View style={styles.reviewStatusRow}>
                        <View style={styles.reviewedPill}>
                          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                          <Text style={styles.reviewedText}>Review Submitted</Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => openReviewModal(item)}
                      >
                        <LinearGradient colors={["#22c55e", "#16a34a"]} style={styles.reviewBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Ionicons name="star" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.reviewBtnText}>Leave Review</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )
                  ) : null}

                  {/* Fabric image */}
                  <Pressable disabled={!isEditing} onPress={() => pickImage(item.id)}>
                    {editedImages[item.id]?.uri || item.fabric_image_url ? (
                      <Image source={{ uri: editedImages[item.id]?.uri || resolveImageUrl(item.fabric_image_url) }} style={styles.fabricImage} />
                    ) : isEditing ? (
                      <View style={styles.addImagePlaceholder}>
                        <Ionicons name="image-outline" size={36} color="#E6B0B0" />
                        <Text style={styles.addImageText}>Tap to add fabric image</Text>
                      </View>
                    ) : null}
                  </Pressable>

                  {/* Expanded section */}
                  {isOpen && (
                    <View style={styles.expandBox}>
                      <Text style={styles.detailTitle}>Quantity</Text>
                      {!isEditing ? (
                        <Text style={styles.quantityDisplay}>{item.quantity}</Text>
                      ) : (
                        <View style={styles.quantityEditRow}>
                          <TouchableOpacity style={styles.qtyDecBtn} onPress={() => setEditedQuantity((prev) => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || item.quantity) - 1) }))}>
                            <Text style={styles.qtyBtnText}>−</Text>
                          </TouchableOpacity>
                          <View style={styles.qtyDisplayEdit}>
                            <Text style={styles.qtyDisplayText}>{editedQuantity[item.id] ?? item.quantity}</Text>
                          </View>
                          <TouchableOpacity style={styles.qtyIncBtn} onPress={() => setEditedQuantity((prev) => ({ ...prev, [item.id]: Math.min(15, (prev[item.id] || item.quantity) + 1) }))}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <Text style={styles.detailTitle}>Measurements</Text>
                      {Object.entries(item.measurements || {}).map(([key, value]) => (
                        <View key={key} style={styles.measureItem}>
                          <Text style={styles.measureKey}>{key.toUpperCase()}</Text>
                          <TextInput
                            editable={isEditing}
                            keyboardType="numeric"
                            maxLength={4}
                            placeholder="0"
                            placeholderTextColor="#4b5563"
                            value={(editedMeasurements[item.id]?.[key]?.toString() ?? value.toString())}
                            onChangeText={(text) => {
                              const numeric = text.replace(/[^0-9.]/g, "");
                              setEditedMeasurements((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || item.measurements), [key]: numeric } }));
                            }}
                            style={[styles.measureInput, !isEditing && styles.measureInputReadonly]}
                          />
                        </View>
                      ))}

                      {!isEditing ? (
                        canEdit ? (
                          <TouchableOpacity style={styles.editBtn} onPress={() => setEditingId(item.id)}>
                            <Ionicons name="create-outline" size={16} color="#e0e7ff" style={{ marginRight: 6 }} />
                            <Text style={styles.btnText}>Edit Order</Text>
                          </TouchableOpacity>
                        ) : null
                      ) : (
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.saveBtn} onPress={() => saveChanges(item)}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.btnText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                            <Text style={styles.btnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Expand chevron */}
                  <View style={styles.chevronRow}>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#4b5563" />
                  </View>
                </View>
              </AnimatedPressable>
            );
          }}
        />
      )}

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Order</Text>
            <Text style={styles.modalSubtitle}>{reviewOrder?.tailor_name || "Tailor"}</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setReviewRating(value)} style={styles.starButton}>
                  <Ionicons
                    name={reviewRating >= value ? "star" : "star-outline"}
                    size={26}
                    color={reviewRating >= value ? "#f59e0b" : "#94a3b8"}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={reviewDescription}
              onChangeText={setReviewDescription}
              placeholder="Share your experience..."
              placeholderTextColor="#6b7280"
              multiline
              style={styles.reviewInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
                disabled={isSubmittingReview}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={submitReview}
                disabled={isSubmittingReview}
              >
                <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.modalSubmitGrad}>
                  <Text style={styles.modalSubmitText}>{isSubmittingReview ? "Submitting..." : "Submit"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16, paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1, borderBottomColor: "rgba(230,176,176,0.08)",
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)", borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  heading: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "#E6B0B0", fontWeight: "600", marginTop: 2 },
  refreshBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(157,42,75,0.1)", alignItems: "center", justifyContent: "center" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptyText: { color: "#E6B0B0", fontSize: 15 },
  listContent: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 40, paddingTop: 16, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  card: { borderRadius: 22, marginBottom: 16, backgroundColor: "rgba(26, 6, 16, 0.45)", borderWidth: 1, borderColor: "rgba(157,42,75,0.2)", overflow: "hidden", shadowColor: "#9D2A4B", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  cardAccent: { height: 3 },
  cardInner: { padding: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  rightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  service: { fontSize: 17, fontWeight: "800", color: "#fff", flex: 1, marginRight: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  infoRowWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: "#E6B0B0", fontWeight: "600" },
  orderIdRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  copyBtn: { marginRight: 2, padding: 4, borderRadius: 6, backgroundColor: "rgba(157,42,75,0.15)" },
  orderIdText: { flex: 1, color: "#E6B0B0", fontSize: 13 },
  infoGrid: { flexDirection: "row", gap: 16, marginTop: 8, marginBottom: 4 },
  infoGridItem: {},
  infoGridLabel: { color: "#f59e0b", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  infoGridValue: { color: "#fff", fontSize: 15, fontWeight: "800", marginTop: 2 },
  descText: { color: "#fff", fontSize: 13, marginTop: 6, lineHeight: 18 },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 4 },
  paymentPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, gap: 6 },
  paymentStatus: { fontSize: 13, fontWeight: "700" },
  payNowBtn: { borderRadius: 10, overflow: "hidden" },
  payNowGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  payNowText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  reviewStatusRow: { marginTop: 10 },
  reviewedPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(34,197,94,0.12)", borderWidth: 1, borderColor: "rgba(34,197,94,0.35)" },
  reviewedText: { color: "#22c55e", fontSize: 12, fontWeight: "700" },
  reviewBtn: { marginTop: 10, borderRadius: 10, overflow: "hidden" },
  reviewBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 9 },
  reviewBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  fabricImage: { width: "100%", height: 160, borderRadius: 14, marginVertical: 10 },
  addImagePlaceholder: { width: "100%", height: 120, borderRadius: 14, marginVertical: 10, backgroundColor: "rgba(26, 6, 16, 0.45)", borderWidth: 2, borderColor: "rgba(157,42,75,0.2)", borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 8 },
  addImageText: { fontSize: 14, fontWeight: "600", color: "#E6B0B0" },
  expandBox: { marginTop: 14, backgroundColor: "rgba(26, 6, 16, 0.3)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(157,42,75,0.15)" },
  detailTitle: { fontWeight: "800", marginBottom: 8, color: "#fff", fontSize: 13, letterSpacing: 0.5 },
  quantityDisplay: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 14 },
  quantityEditRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 14 },
  qtyDecBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(239, 68, 68, 1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
  qtyIncBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(16,185,129,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(16,185,129,0.4)" },
  qtyBtnText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  qtyDisplayEdit: { minWidth: 64, height: 42, borderRadius: 12, backgroundColor: "rgba(26, 6, 16, 0.6)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  qtyDisplayText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  measureItem: { marginBottom: 10 },
  measureKey: { fontWeight: "700", marginBottom: 4, color: "#E6B0B0", fontSize: 12, letterSpacing: 0.5 },
  measureInput: { backgroundColor: "rgba(26, 6, 16, 0.5)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)", color: "#fff", fontSize: 14 },
  measureInputReadonly: { borderColor: "rgba(157,42,75,0.15)", color: "#E6B0B0" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(157,42,75,0.15)", padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#9D2A4B", padding: 12, borderRadius: 12 },
  cancelBtn: { flex: 1, backgroundColor: "rgba(239, 68, 68, 1)", padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  chevronRow: { alignItems: "center", marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 15, 19, 0.85)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", borderRadius: 18, padding: 16, backgroundColor: "#1a0610", borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  modalSubtitle: { fontSize: 12, fontWeight: "700", color: "#E6B0B0", marginTop: 4, marginBottom: 12 },
  starRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 },
  starButton: { padding: 6 },
  reviewInput: { minHeight: 90, borderRadius: 12, borderWidth: 1, borderColor: "rgba(157,42,75,0.25)", backgroundColor: "rgba(26, 6, 16, 0.5)", color: "#fff", padding: 12, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.2)", alignItems: "center" },
  modalCancelText: { color: "#f87171", fontWeight: "700" },
  modalSubmitBtn: { flex: 1, borderRadius: 12, overflow: "hidden" },
  modalSubmitGrad: { paddingVertical: 12, alignItems: "center" },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
});