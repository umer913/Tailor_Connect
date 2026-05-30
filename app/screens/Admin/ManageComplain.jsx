import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SERVER = "https://tailorx-production.up.railway.app:3001";
const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 980 : IS_TABLET ? 840 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 18;

const getStatusColor = (resolvedAt) => (resolvedAt ? "#00ff99" : "#ffcc00");
const getStatusLabel = (resolvedAt) => (resolvedAt ? "Resolved" : "Pending");

export default function ManageComplain() {
  const [complaints, setComplaints] = useState([]);
  const [responses, setResponses] = useState({});

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchComplaints();
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/admin/complaints`);
      setComplaints(res.data);
    } catch (err) {
      Alert.alert("Error fetching complaints");
    }
  };

  const getResponseText = (id) => responses[id]?.trim() || "";
  const setResponseText = (id, text) => {
    setResponses((prev) => ({ ...prev, [id]: text }));
  };
  const clearResponseText = (id) => {
    setResponses((prev) => ({ ...prev, [id]: "" }));
  };

  // Send message only
  const sendMessage = async (item) => {
    if (!getResponseText(item.id)) {
      Alert.alert("Write a message first");
      return;
    }

    try {
      await axios.post(`${SERVER}/admin/send-message`, {
        complaint_id: item.id,
        message: getResponseText(item.id),
      });

      Alert.alert("Message sent successfully to " + item.filed_by_email);
      clearResponseText(item.id);
    } catch (err) {
      console.log(err);
      Alert.alert("Error sending message");
    }
  };

  // Resolve complaint & send message
  const resolveComplaint = async (id) => {
    if (!getResponseText(id)) {
      Alert.alert("Write a message first");
      return;
    }

    try {
      await axios.put(`${SERVER}/admin/respond-complaint/${id}`, {
        admin_response: getResponseText(id),
      });

      Alert.alert("Complaint resolved and message sent successfully");
      clearResponseText(id);
      fetchComplaints();
    } catch (err) {
      console.log(err);
      Alert.alert("Error resolving complaint");
    }
  };

  const renderItem = ({ item }) => {
    const isResolved = Boolean(item.resolved_at);

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.headerRow}>
          <Ionicons name="alert-circle-outline" size={22} color="#fff" />
          <Text style={styles.subject}>{item.subject}</Text>
        </View>

        <Text style={styles.text}>
          Filed By: {item.filed_by_email} ({item.filed_by_role})
        </Text>
        <Text style={styles.text}>
          Against: {item.against_email} ({item.against_name})
        </Text>
        <Text style={styles.text}>Order ID: {item.order_id || "N/A"}</Text>

        <Text
          style={[
            styles.status,
            { color: getStatusColor(item.resolved_at) },
          ]}
        >
          {getStatusLabel(item.resolved_at)}
        </Text>

        <Text style={styles.desc}>{item.description}</Text>

        {item.attachment_url && (
          <Image source={{ uri: item.attachment_url }} style={styles.image} />
        )}

        {!isResolved && (
          <>
            {/* Admin Response Input always visible */}
            <TextInput
              placeholder="Type your message or response..."
              placeholderTextColor="#ccc"
              value={responses[item.id] || ""}
              onChangeText={(text) => setResponseText(item.id, text)}
              style={styles.input}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.sendBtn]}
                onPress={() => sendMessage(item)}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.actionText}>Send Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.resolveBtn]}
                onPress={() => resolveComplaint(item.id)}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.actionText}>Resolve & Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {item.admin_response && (
          <Text style={styles.adminResponse}>
            Admin: {item.admin_response}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Complaint Box</Text>
        <Text style={styles.sub}>TailorX Admin Management</Text>

        {complaints.length === 0 ? (
          <Text style={styles.emptyText}>
            No complaints to show
          </Text>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: PAGE_GUTTER,
  },

  listContent: {
    paddingBottom: 40,
    width: '100%',
    alignItems: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
  },

  sub: {
    color: "#aaa",
    marginBottom: 20,
  },

  card: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  subject: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },

  text: {
    color: "#ddd",
    fontSize: 13,
    marginTop: 2,
  },

  status: {
    fontWeight: "700",
    marginTop: 6,
  },

  desc: {
    color: "#fff",
    marginTop: 8,
  },

  input: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  actionBtn: {
    flex: 0.48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 40,
  },
  sendBtn: {
    backgroundColor: "#007bff",
  },
  resolveBtn: {
    backgroundColor: "#ff5252",
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },

  adminResponse: {
    marginTop: 10,
    color: "#00ff99",
    fontWeight: "600",
  },

  image: {
    width: "100%",
    height: 150,
    borderRadius: 15,
    marginTop: 10,
  },
  emptyText: {
    color: "#aaa",
    marginTop: 50,
  },
});