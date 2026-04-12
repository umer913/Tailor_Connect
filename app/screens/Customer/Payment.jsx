import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://UF-MacBook-Pro.local:3000";

export default function Payment({ route, navigation }) {
  const orderId = route?.params?.orderId;
  const customerEmail =
    route?.params?.CustomerEmail ||
    route?.params?.customerEmail ||
    route?.params?.email ||
    "";

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState({ status: "unpaid", method: null });
  const [latestSessionId, setLatestSessionId] = useState("");

  const isPaid = payment?.status === "paid";

  const fetchPaymentContext = async () => {
    if (!orderId) {
      Alert.alert("Missing order", "No order ID was provided for payment.");
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const orderResponse = await axios.get(`${API_BASE_URL}/payment/order/${orderId}`, {
        params: { customer_email: customerEmail || undefined },
      });

      setOrder(orderResponse?.data?.order || null);
      setPayment(orderResponse?.data?.payment || { status: "unpaid", method: null });
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentContext();
  }, [orderId]);

  const verifyCardPayment = async (sessionId) => {
    if (!sessionId) {
      Alert.alert("Missing session", "Card session is not available for verification.");
      return;
    }

    try {
      setVerifying(true);

      const response = await axios.post(`${API_BASE_URL}/payment/verify-card-session`, {
        session_id: sessionId,
        order_id: orderId,
      });

      const verified = Boolean(response?.data?.verified);

      if (verified) {
        Alert.alert("Payment successful", "Your card payment has been confirmed.");
      } else {
        Alert.alert("Not paid yet", "Payment is still pending. Complete checkout and verify again.");
      }

      await fetchPaymentContext();
    } catch (error) {
      Alert.alert("Verification failed", error?.response?.data?.error || "Failed to verify payment.");
    } finally {
      setVerifying(false);
    }
  };

  const startCardCheckout = async () => {
    try {
      setProcessing(true);

      const response = await axios.post(`${API_BASE_URL}/payment/create-checkout-session`, {
        order_id: orderId,
        customer_email: customerEmail,
      });

      const checkoutUrl = response?.data?.checkout_url;
      const sessionId = response?.data?.session_id;

      if (!checkoutUrl || !sessionId) {
        throw new Error("Checkout URL not received from server.");
      }

      setLatestSessionId(sessionId);
      await WebBrowser.openBrowserAsync(checkoutUrl);
      await verifyCardPayment(sessionId);
    } catch (error) {
      Alert.alert("Checkout failed", error?.response?.data?.error || error?.message || "Unable to start card checkout.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <LinearGradient colors={["#1b254f", "#0c1435", "#080927"]} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>Payment</Text>
          <Text style={styles.text}>Order ID: {orderId}</Text>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#d1d9ff" />
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{order?.service_type || "Tailor Order"}</Text>
                <Text style={styles.summaryLabel}>Tailor</Text>
                <Text style={styles.summaryValue}>{order?.tailor_name || "-"}</Text>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.amountText}>PKR {order?.total_amount ?? "0"}</Text>
                <Text style={[styles.paymentBadge, isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                  {isPaid
                    ? `Paid via ${String(payment?.method || "").replace("_", " ")}`
                    : "Unpaid"}
                </Text>
              </View>

              {!isPaid && (
                <>
                  <View style={styles.actionBox}>
                    <Text style={styles.subText}>A secure checkout page will open for card payment.</Text>

                    <TouchableOpacity
                      style={[styles.primaryButton, (processing || verifying) && styles.buttonDisabled]}
                      onPress={startCardCheckout}
                      disabled={processing || verifying}
                    >
                      <Text style={styles.primaryButtonText}>
                        {processing ? "Opening Checkout..." : "Pay With Card"}
                      </Text>
                    </TouchableOpacity>

                    {!!latestSessionId && (
                      <TouchableOpacity
                        style={[styles.secondaryButton, verifying && styles.buttonDisabled]}
                        onPress={() => verifyCardPayment(latestSessionId)}
                        disabled={verifying}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {verifying ? "Verifying..." : "Verify Card Payment"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    padding: 8,
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
  },
  content: {
    marginTop: 30,
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)",
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#d1d9ff",
    marginBottom: 12,
  },
  loaderWrap: {
    paddingVertical: 50,
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
  },
  summaryLabel: {
    color: "#8e9ccf",
    fontSize: 12,
    marginTop: 6,
  },
  summaryValue: {
    color: "#d1d9ff",
    fontSize: 15,
    fontWeight: "700",
  },
  amountText: {
    color: "#fbcf74",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  paymentBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "700",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  badgePaid: {
    backgroundColor: "rgba(34,197,94,0.2)",
    color: "#86efac",
  },
  badgeUnpaid: {
    backgroundColor: "rgba(239,68,68,0.2)",
    color: "#fca5a5",
  },
  actionBox: {
    marginTop: 14,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#3957a6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#e6ebff",
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "rgba(42,60,114,0.8)",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(142,156,207,0.35)",
  },
  secondaryButtonText: {
    color: "#d1d9ff",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  text: {
    fontSize: 16,
    color: "#c3d1ff",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#8e9ccf",
  },
});
