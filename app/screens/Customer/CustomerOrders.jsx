import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CustomerOrders({ route }) {
  const CustomerEmail = route?.params?.CustomerEmail || "";
  const [orders, setOrders] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://UF-MacBook-Pro.local:3000/customer-orders",
        { params: { email: CustomerEmail } }
      );

      if (data.orders) {
        setOrders(data.orders);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.log("Fetch Orders Error:", err);
    }
  };

  /* ---------------- DELETE ORDER ---------------- */
  const deleteOrder = (id) => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to delete this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `http://UF-MacBook-Pro.local:3000/delete-order/${id}`
              );

              setOrders((prev) => prev.filter((o) => o.id !== id));
            } catch (err) {
              console.log("Delete order error", err);
            }
          },
        },
      ]
    );
  };

  /* ---------------- STATUS COLORS ---------------- */
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#3b82f6";
      case "stitching":
        return "#8b5cf6";
      case "ready":
        return "#10b981";
      case "delivered":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  /* ---------------- ORDER CARD ---------------- */
  const renderItem = ({ item, index }) => {
    const slideAnim = new Animated.Value(40);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.rowBetween}>
          <Text style={styles.service}>{item.service_type}</Text>

          <View style={styles.rightHeader}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={() => deleteOrder(item.id)}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.tailor}>Tailor: {item.tailor_name}</Text>

        {item.fabric_image_url && (
          <Image
            source={{ uri: item.fabric_image_url }}
            style={styles.fabricImage}
          />
        )}

        <View style={styles.rowBetween}>
          <Text style={styles.price}>Rs. {item.price}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toDateString()}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={["#1f2933", "#111827"]}
      style={styles.container}
    >
      <Text style={styles.heading}>My Orders</Text>

      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </LinearGradient>
  );
}

/* ---------------- STYLES (TailorX Theme) ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  service: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e5e7eb",
  },

  tailor: {
    fontSize: 14,
    color: "#9ca3af",
    marginVertical: 6,
  },

  fabricImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginVertical: 10,
  },

  price: {
    fontSize: 17,
    fontWeight: "700",
    color: "#93c5fd",
  },

  date: {
    fontSize: 12,
    color: "#9ca3af",
  },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  closeBtn: {
    backgroundColor: "#374151",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "700",
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: 18,
    textAlign: "center",
    marginTop: 120,
  },
});
