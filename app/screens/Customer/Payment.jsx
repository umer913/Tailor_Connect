import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const API_BASE_URL = "http://localhost:3001";
const { width: SCREEN_W } = Dimensions.get("window");
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

export default function Payment({ route, navigation }) {
  const orderId = route?.params?.orderId;
  const customerEmail =
    route?.params?.CustomerEmail ||
    route?.params?.customerEmail ||
    route?.params?.email ||
    "";

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState({ status: "unpaid", method: null });
  const pollStopRef = useRef(null);

  const isPaid = payment?.status === "paid";

  const fetchPaymentContext = async () => {
    if (!orderId) {
      Alert.alert("Missing order", "No order ID was provided for payment.");
      navigation.goBack();
      return;
    }
    try {
      setLoading(true);
      const orderResponse = await axios.get(`${API_BASE_URL}/payments/order/${orderId}`, {
        params: { customer_email: customerEmail || undefined },
      });
      setOrder(orderResponse?.data?.order || null);
      setPayment(orderResponse?.data?.payment || { status: "unpaid", method: null });
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || "Failed to load payment details");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPaymentContext(); }, [orderId]);

  useEffect(() => {
    if (loading || isPaid || !orderId) {
      if (pollStopRef.current) {
        clearTimeout(pollStopRef.current);
        pollStopRef.current = null;
      }
      return;
    }

    let pollInterval = null;
    const stopPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = null;
    };

    pollInterval = setInterval(() => {
      fetchPaymentContext();
    }, 3000);

    pollStopRef.current = setTimeout(() => {
      stopPolling();
    }, 15000);

    return () => {
      stopPolling();
      if (pollStopRef.current) {
        clearTimeout(pollStopRef.current);
        pollStopRef.current = null;
      }
    };
  }, [loading, isPaid, orderId]);

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const response = await axios.post(`${API_BASE_URL}/payments/stripe-checkout`, { order_id: orderId, customer_email: customerEmail });
      const paymentUrl = response?.data?.payment_url;
      if (!paymentUrl) throw new Error("Stripe checkout URL not received.");

      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch (error) {
      Alert.alert("Checkout failed", error?.response?.data?.error || error?.message || "Unable to start Stripe checkout.");
    } finally { setProcessing(false); }
  };

  const handleInvoice = async () => {
    try {
      const invoiceUrl = `${API_BASE_URL}/payments/invoice/${orderId}?customer_email=${encodeURIComponent(customerEmail || "")}`;
      await WebBrowser.openBrowserAsync(invoiceUrl);
    } catch (error) {
      Alert.alert("Invoice failed", error?.message || "Unable to open invoice.");
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
          <Text style={styles.heading}>Payment</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#9D2A4B" />
            <Text style={styles.loaderText}>Loading payment details...</Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <LinearGradient
              colors={isPaid ? ["rgba(5,150,105,0.2)", "rgba(16,185,129,0.1)"] : ["rgba(157,42,75,0.15)", "rgba(214,64,106,0.1)"]}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {/* Status banner */}
              <View style={[styles.statusBanner, isPaid ? styles.bannerPaid : styles.bannerUnpaid]}>
                <Ionicons name={isPaid ? "checkmark-circle" : "time"} size={16} color={isPaid ? "#10b981" : "#f59e0b"} />
                <Text style={[styles.statusBannerText, { color: isPaid ? "#10b981" : "#f59e0b" }]}>
                  {isPaid ? `Paid via ${String(payment?.method || "").replace("_", " ")}` : "Unpaid"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>SERVICE</Text>
                  <Text style={styles.summaryValue}>{order?.service_type || "Tailor Order"}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>ORDER ID</Text>
                  <Text style={styles.summaryValue}>{orderId}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>TAILOR</Text>
                  <Text style={styles.summaryValue}>{order?.tailor_name || "—"}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.amountRow}>
                <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.amountText}>PKR {order?.total_amount ?? "0"}</Text>
              </View>
            </LinearGradient>

            {!isPaid && (
              <View style={styles.actionSection}>

                {/* ============ STRIPE CHECKOUT ============ */}
                <View style={styles.paymentMethodSection}>


                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={processing}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={processing ? ["#374151", "#374151"] : ["#6772e5", "#7a87f5"]}
                      style={styles.primaryButton}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>
                        {processing ? "Opening Stripe..." : "Pay with Card (Stripe)"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isPaid && (
              <View style={styles.paidConfirmation}>
                <LinearGradient colors={["rgba(5,150,105,0.2)", "rgba(16,185,129,0.1)"]} style={styles.paidIconWrap}>
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                </LinearGradient>
                <Text style={styles.paidTitle}>Payment Confirmed</Text>
                <TouchableOpacity style={styles.invoiceBtn} onPress={handleInvoice} activeOpacity={0.85}>
                  <LinearGradient colors={["#1f2937", "#111827"]} style={styles.invoiceGrad}>
                    <Ionicons name="document-text-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.invoiceText}>View Invoice (PDF)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16,
    paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,176,176,0.08)",
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  heading: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "#E6B0B0", fontWeight: "600", marginTop: 2 },
  scrollContent: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 60, paddingTop: 20, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  loaderWrap: { alignItems: "center", marginTop: 60 },
  loaderText: { color: "#E6B0B0", marginTop: 12, fontSize: 15, fontWeight: "600" },
  summaryCard: {
    borderRadius: 22, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  statusBanner: {
    flexDirection: "row", alignItems: "center",
    padding: 10, borderRadius: 12, marginBottom: 16, gap: 8,
  },
  bannerPaid: { backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  bannerUnpaid: { backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  statusBannerText: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  summaryRow: { paddingVertical: 4 },
  summaryItem: {},
  summaryLabel: { color: "#E6B0B0", fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  summaryValue: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 4 },
  divider: { height: 1, backgroundColor: "rgba(157,42,75,0.15)", marginVertical: 14 },
  amountRow: {},
  amountText: { color: "#fcd34d", fontSize: 28, fontWeight: "800", marginTop: 4 },
  actionSection: { gap: 14 },



  // Payment method section
  paymentMethodSection: { gap: 12, marginTop: 4 },
  secureNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(16,185,129,0.1)",
    padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.2)",
  },
  secureText: { color: "#6ee7b7", fontSize: 13, fontWeight: "600" },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, borderRadius: 16,
    shadowColor: "#9D2A4B", shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 15, borderRadius: 16,
    backgroundColor: "rgba(157,42,75,0.12)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
  },
  secondaryButtonText: { color: "#E6B0B0", fontWeight: "700", fontSize: 15 },



  // Paid confirmation
  paidConfirmation: { alignItems: "center", marginTop: 24, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  paidIconWrap: {
    width: 90, height: 90, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
  },
  paidTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 6 },
  paidSub: { color: "#E6B0B0", fontSize: 15, fontWeight: "600", textAlign: "center" },
  invoiceBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  invoiceGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 },
  invoiceText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
