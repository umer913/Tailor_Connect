import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CustomerOrders({ route }) {
  const navigation = useNavigation();
  const CustomerEmail = route?.params?.CustomerEmail || "";

  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(
          "http://UF-MacBook-Pro.local:3000/get-orders",
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
    fetchOrders();
  }, []);

  const deleteOrder = (id) => {
    Alert.alert("Delete Order", "Are you sure?", [
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
            console.log("Delete error", err);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#3b82f6";
      case "in_progress":
        return "#8b5cf6";
      case "completed":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  return (
    <LinearGradient
      colors={["#64769eff", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.navigate("CustomerDashboard", { CustomerEmail })
        }
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>My Orders</Text>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const slideAnim = new Animated.Value(40);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }).start();

            const isOpen = expandedId === item.id;

            return (
              <AnimatedPressable
                onPress={() => setExpandedId(isOpen ? null : item.id)}
                style={[
                  styles.card,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                {/* Card Header */}
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

                {/* Tailor & Image */}
                <Text style={styles.tailor}>Tailor: {item.tailor_name}</Text>
                {item.fabric_image_url && (
                  <Image
                    source={{ uri: item.fabric_image_url }}
                    style={styles.fabricImage}
                  />
                )}

                {/* Price & Date */}
                <View style={styles.rowBetween}>
                  <Text style={styles.price}>Rs. {item.price}</Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toDateString()}
                  </Text>
                </View>

                {/* Expanded Details */}
                {isOpen && (
                  <View style={styles.expandBox}>
                    <Text style={styles.detailTitle}>Order Details</Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Gender: </Text>
                      {item.gender}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Service: </Text>
                      {item.service_type}
                    </Text>
                    <Text style={styles.detailLabel}>Measurements:</Text>
                    {item.measurements &&
                      Object.entries(item.measurements).map(([key, value]) => (
                        <Text key={key} style={styles.measurementItem}>
                          • {key}: {value}
                        </Text>
                      ))}
                  </View>
                )}
              </AnimatedPressable>
            );
          }}
        />
      )}
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 20,
  },

  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    zIndex: 10,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f8f4f4ff",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
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
    color: "#333",
  },

  tailor: {
    fontSize: 14,
    color: "#666",
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
    color: "#3b5998",
  },

  date: {
    fontSize: 12,
    color: "#777",
  },

  statusBadge: {
    paddingVertical: 6,
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
    backgroundColor: "#f2f2f2",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#d85b5b",
    fontSize: 14,
    fontWeight: "700",
  },

  /* 🔽 EXPAND STYLES */
  expandBox: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
  },

  detailTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1f2937",
  },

  detailLabel: {
    fontWeight: "700",
    color: "#374151",
  },

  detailText: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 4,
  },

  measurementItem: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 6,
    marginTop: 2,
  },

  emptyText: {
    color: "#f1f1f1",
    fontSize: 18,
    textAlign: "center",
    marginTop: 120,
  },
});
