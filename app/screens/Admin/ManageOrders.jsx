import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { resolveImageUrl } from "../../api.js";
import {
    Alert,
    FlatList,
    Image,
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
      const res = await axios.get("http://UF-MacBook-Pro.local:3001/orders/get-orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.log(err);
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
            await axios.delete(`http://UF-MacBook-Pro.local:3001/admin/remove-order/${id}`);
            setOrders((prev) => prev.filter((o) => o.id !== id));
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isOpen = openId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpenId(isOpen ? null : item.id)}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="receipt-outline" size={22} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.full_name || "Customer"}</Text>
            <Text style={styles.sub}>Tailor: {item.tailor_name || "N/A"}</Text>
          </View>

          <TouchableOpacity onPress={() => removeOrder(item.id)} style={styles.delete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isOpen && (
          <View style={styles.details}>

            <Info label="Service" value={item.service_type} />
            <Info label="Gender" value={item.gender} />
            <Info label="Price" value={`Rs. ${item.price}`} />
            <Info label="Status" value={item.status} />
            <Info label="Customer Email" value={item.customer_email} />
            <Info label="Tailor Email" value={item.tailor_email} />
           
            <Info label="Created At" value={new Date(item.created_at).toLocaleString()} />

            {item.measurements && (
              <>
                <Text style={styles.section}>Measurements</Text>
                {Object.entries(item.measurements).map(([k, v]) => (
                  <Text key={k} style={styles.measure}>• {k}: {v}</Text>
                ))}
              </>
            )}

            {item.fabric_image_url && (
              <>
                <Text style={styles.section}>Fabric</Text>
                <Image source={{ uri: resolveImageUrl(item.fabric_image_url) }} style={styles.image} />
              </>
            )}

          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={{ flex: 1 }}>
      <View style={styles.container}>

        <Text style={styles.heading}>Manage Orders</Text>
        <Text style={styles.subTitle}>TailorX Admin</Text>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        />

        {orders.length === 0 && (
          <Text style={styles.empty}>No Orders Found</Text>
        )}

      </View>
    </LinearGradient>
  );
}

const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },

  subTitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5c6bc0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  sub: {
    color: "#bbb",
    fontSize: 13,
  },

  delete: {
    backgroundColor: "#ff5252",
    padding: 8,
    borderRadius: 30,
  },

  details: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    color: "#aaa",
  },

  value: {
    color: "#fff",
  },

  section: {
    color: "#aaa",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
  },

  measure: {
    color: "#ddd",
    fontSize: 14,
  },

  image: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginTop: 8,
  },

  empty: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 120,
    fontSize: 18,
  },
});
