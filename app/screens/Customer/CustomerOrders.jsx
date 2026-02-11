import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CustomerOrders({ route }) {
  const navigation = useNavigation();
  const CustomerEmail = route?.params?.CustomerEmail || "";

  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedMeasurements, setEditedMeasurements] = useState({});
  const [editedQuantity, setEditedQuantity] = useState({});
  const [editedImages, setEditedImages] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://UF-MacBook-Pro.local:3000/get-orders",
        { params: { email: CustomerEmail } }
      );
      setOrders(data.orders || []);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log(err);
    }
  };

  const pickImage = async (orderId) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled) {
      setEditedImages((prev) => ({
        ...prev,
        [orderId]: res.assets[0],
      }));
    }
  };

  const saveChanges = async (order) => {
    try {
      const formData = new FormData();

      formData.append("orderId", order.id);
      formData.append(
        "measurements",
        JSON.stringify(editedMeasurements[order.id] || order.measurements)
      );
      formData.append("quantity", editedQuantity[order.id] || order.quantity);

      if (editedImages[order.id]) {
        formData.append("fabric", {
          uri: editedImages[order.id].uri,
          name: "fabric.jpg",
          type: "image/jpeg",
        });
      }

      await axios.put(
        "http://UF-MacBook-Pro.local:3000/update-order",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
Alert.alert("Success", "Order updated successfully");
      setEditingId(null);
      fetchOrders();
    } catch (err) {
      console.log("Update failed", err);
    }
  };

  const deleteOrder = (id) => {
    Alert.alert("Delete Order", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await axios.delete(
            `http://UF-MacBook-Pro.local:3000/delete-order/${id}`
          );
          Alert.alert("Success", "Order deleted successfully");
          setOrders((prev) => prev.filter((o) => o.id !== id));
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    return (
      {
        pending: "#f59e0b",
        accepted: "#3b82f6",
        in_progress: "#8b5cf6",
        completed: "#22c55e",
      }[status] || "#6b7280"
    );
  };

  return (
    <LinearGradient colors={["#1b254f", "#0c1435", "#080927"]} style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.navigate("CustomerDashboard", { CustomerEmail })
        }
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.heading}>My Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isOpen = expandedId === item.id;
          const isEditing = editingId === item.id;

          return (
            <AnimatedPressable
              onPress={() => setExpandedId(isOpen ? null : item.id)}
              style={[styles.card, { opacity: fadeAnim }]}
            >
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
                  <Pressable onPress={() => deleteOrder(item.id)}>
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.tailor}>Tailor: {item.tailor_name}</Text>
              <Text style={styles.tailor}>Quantity: {item.quantity}</Text>
              <Pressable
                disabled={!isEditing}
                onPress={() => pickImage(item.id)}
              >
                {editedImages[item.id]?.uri || item.fabric_image_url ? (
                  <Image
                    source={{
                      uri:
                        editedImages[item.id]?.uri ||
                        item.fabric_image_url,
                    }}
                    style={styles.fabricImage}
                  />
                ) : isEditing ? (
                  <View style={styles.addImagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#999" />
                    <Text style={styles.addImageText}>Add Image</Text>
                  </View>
                ) : null}
              </Pressable>

              {isOpen && (
                <View style={styles.expandBox}>
                  <Text style={styles.detailTitle}>Quantity</Text>
                  {!isEditing ? (
                    <Text style={styles.quantityDisplay}>{item.quantity}</Text>
                  ) : (
                    <View style={styles.quantityEditRow}>
                      <TouchableOpacity
                        style={styles.qtyDecBtn}
                        onPress={() =>
                          setEditedQuantity((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, (prev[item.id] || item.quantity) - 1),
                          }))
                        }
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <View style={styles.qtyDisplayEdit}>
                        <Text style={styles.qtyDisplayText}>
                          {editedQuantity[item.id] ?? item.quantity}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.qtyIncBtn}
                        onPress={() =>
                          setEditedQuantity((prev) => ({
                            ...prev,
                            [item.id]: Math.min(15, (prev[item.id] || item.quantity) + 1),
                          }))
                        }
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={styles.detailTitle}>Measurements</Text>
                  

  {Object.entries(item.measurements || {}).map(([key, value]) => (
  <View key={key} style={{ marginBottom: 10 }}>
    <Text style={{ fontWeight: "600", marginBottom: 4 }}>
      {key.toUpperCase()}
    </Text>

    <TextInput
      editable={isEditing}
      keyboardType="numeric"
      maxLength={4}
      placeholder="0"
      value={
        editedMeasurements[item.id]?.[key]?.toString() ??
        value.toString()
      }
      onChangeText={(text) => {
       
        const numericText = text.replace(/[^0-9.]/g, "");

        setEditedMeasurements((prev) => ({
          ...prev,
          [item.id]: {
            ...(prev[item.id] || item.measurements),
            [key]: numericText,
          },
        }));
      }}
      style={styles.input}
    />
  </View>
))}


                  {!isEditing ? (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => setEditingId(item.id)}
                    >
                      <Text style={styles.btnText}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() => saveChanges(item)}
                      >
                        <Text style={styles.btnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setEditingId(null)}
                      >
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </AnimatedPressable>
          );
        }}
      />
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 90, paddingHorizontal: 20 },
  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  heading: { marginLeft: 125, fontSize: 26, fontWeight: "800", color: "#d1d9ff", marginBottom: 25 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  service: { fontSize: 18, fontWeight: "800" },
  tailor: { fontSize: 14, color: "#666", marginVertical: 6 },
  fabricImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginVertical: 10,
  },
  addImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  closeText: { color: "#d85b5b", fontSize: 16 },
  expandBox: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
  },
  detailTitle: { fontWeight: "800", marginBottom: 8 },
  quantityDisplay: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 14 },
  quantityEditRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  qtyDecBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dc2626",
  },
  qtyIncBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  qtyDisplayEdit: {
    minWidth: 70,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  qtyDisplayText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editBtn: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});