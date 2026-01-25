import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://UF-MacBook-Pro.local:3000/get-orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.log("Fetch orders error:", err);
    }
  };

  const removeOrder = (id) => {
    Alert.alert("Remove Order", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`http://UF-MacBook-Pro.local:3000/remove-order/${id}`);
            setOrders((prev) => prev.filter((o) => o.id !== id));
          } catch (err) {
            console.log("Delete error:", err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isOpen = openId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setOpenId(isOpen ? null : item.id)}
      >
        {/* Header Row */}
        <View style={styles.row}>
          <Text style={styles.name}>Customer: {item.full_name || "Customer"}</Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeOrder(item.id)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tailor Name */}
        <Text style={styles.tailorName}>Tailor: {item.tailor_name || "N/A"}</Text>

        {/* Expandable Details */}
        {isOpen && (
          <View style={styles.details}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View>
                  <Text style={styles.detailLabel}>Service Type:</Text>
                  <Text style={styles.detailText}>{item.service_type || "N/A"}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailText}>{item.gender || "N/A"}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.detailText}>Rs. {item.price || "N/A"}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Options:</Text>
                  <Text style={styles.detailText}>
                    {item.options ? JSON.stringify(item.options) : "N/A"}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.detailLabel}>Measurements:</Text>
              {item.measurements
                ? Object.entries(item.measurements).map(([key, val]) => (
                    <Text key={key} style={styles.measurementText}>
                      • {key}: {val}
                    </Text>
                  ))
                : <Text style={styles.detailText}>N/A</Text>}
            </View>

            {item.fabric_image_url && (
              <Image
                source={{ uri: item.fabric_image_url }}
                style={styles.fabricImage}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#1e1e2f", "#3b3f56"]} style={styles.container}>
      <Text style={styles.heading}>Manage Orders</Text>

      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f1f1f1",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 1.2,
  },

  card: {
    backgroundColor: "#2b2f44",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e1e4f2",
  },

  tailorName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#b0b5d9",
  },

  removeBtn: {
    backgroundColor: "#ef5350",
    padding: 10,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    shadowColor: "#d84315",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },

  details: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#444a6a",
    paddingTop: 14,
  },

  detailLabel: {
    color: "#99a0c4",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },

  detailText: {
    fontSize: 15,
    color: "#c1c5d7",
    letterSpacing: 0.4,
  },

  measurementText: {
    fontSize: 14,
    color: "#a3a8c1",
    marginBottom: 2,
  },

  fabricImage: {
    marginTop: 16,
    width: "100%",
    height: 160,
    borderRadius: 14,
  },

  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 20,
    textAlign: "center",
    marginTop: 140,
    fontWeight: "700",
  },
});
