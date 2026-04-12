import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SERVER = "http://UF-MacBook-Pro.local:3000";
const TARGET_REQUIRED_TYPES = [
  "Customer Misbehaviour",
  "Payment Not Received",
  "Order Cancellation",
];
const COMPLAINT_TYPE_OPTIONS = [
  { label: "General Platform Issue", value: "General" },
  { label: "Customer Misbehaviour", value: "Customer Misbehaviour" },
  { label: "Payment Not Received", value: "Payment Not Received" },
  { label: "Order Cancellation Dispute", value: "Order Cancellation" },
  { label: "Other", value: "Other" },
];

export default function TailorComplainBox({ route }) {
  const email = route.params?.email;

  const [complaintType, setComplaintType] = useState("General");
  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [followUps, setFollowUps] = useState({});
  const shouldRequireTargetFields = TARGET_REQUIRED_TYPES.includes(complaintType);

  const resetForm = () => {
    setAgainstEmail("");
    setOrderId("");
    setSubject("");
    setDescription("");
    setImage(null);
    setComplaintType("General");
  };

  const setFollowUpText = (id, text) => {
    setFollowUps((prev) => ({ ...prev, [id]: text }));
  };

  const clearFollowUpText = (id) => {
    setFollowUps((prev) => ({ ...prev, [id]: "" }));
  };

  /* ================= IMAGE PICK ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  /* ================= FETCH ================= */
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/my-complaints/${email}`);
      setComplaints(res.data);
    } catch {
      Alert.alert("Error fetching complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ================= DELETE ================= */
  const deleteComplaint = async (id) => {
    Alert.alert("Delete Complaint", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/delete-complaint/${id}/${email}`);
            fetchComplaints();
          } catch {
            Alert.alert("Error deleting complaint");
          }
        }
      }
    ]);
  };

  /* ================= SUBMIT ================= */
  const submitComplaint = async () => {
    if (!subject || !description) {
      Alert.alert("Please fill required fields");
      return;
    }

    // 🔥 Only require email + orderId for these 3 types
    if (shouldRequireTargetFields) {
      if (!againstEmail || !orderId) {
        Alert.alert(
          "Customer Email and Order ID are required for this complaint type"
        );
        return;
      }
    }

    try {
      await axios.post(`${SERVER}/file-complaint`, {
        filed_by_email: email,
        filed_by_role: "tailor",
        against_email: shouldRequireTargetFields ? againstEmail : null,
        order_id: shouldRequireTargetFields ? orderId : null,
        complaint_type: complaintType,
        subject,
        description,
        attachment_url: image || null
      });

      Alert.alert("Complaint submitted successfully");
      resetForm();
      fetchComplaints();
    } catch {
      Alert.alert("Error submitting complaint");
    }
  };

  const sendFollowUp = async (complaintId) => {
    const message = String(followUps[complaintId] || "").trim();
    if (!message) {
      Alert.alert("Write a message first");
      return;
    }

    try {
      await axios.post(`${SERVER}/complaints/follow-up`, {
        complaint_id: complaintId,
        filed_by_email: email,
        message,
      });

      clearFollowUpText(complaintId);
      fetchComplaints();
      Alert.alert("Follow-up sent");
    } catch (err) {
      const messageText = err.response?.data?.error || "Could not send follow-up";
      Alert.alert("Error", messageText);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2B0F14", "#3A1419", "#4A1C22"]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complaint Center</Text>
            <Text style={styles.headerSub}>File a complaint</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.formCard}>

            {/* Complaint Type */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={complaintType}
                onValueChange={setComplaintType}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="#4A1C22"
              >
                {COMPLAINT_TYPE_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} color="#4A1C22" />
                ))}
              </Picker>
            </View>

            {/* 🔥 CONDITIONAL FIELDS */}
            {shouldRequireTargetFields && (
              <>
                <TextInput
                  placeholder="Customer Email *"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={againstEmail}
                  onChangeText={setAgainstEmail}
                />

                <TextInput
                  placeholder="Order ID *"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={orderId}
                  onChangeText={setOrderId}
                />
              </>
            )}

            <TextInput
              placeholder="Subject *"
              placeholderTextColor="#888"
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
            />

            <TextInput
              placeholder="Description *"
              placeholderTextColor="#888"
              style={[styles.input, { height: 90 }]}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={{ color: "#4A1C22", fontWeight: "600" }}>
                Upload Proof Image
              </Text>
            </TouchableOpacity>

            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={submitComplaint}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Submit Complaint
              </Text>
            </TouchableOpacity>
          </View>

          {/* MY COMPLAINTS */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.sectionTitle}>My Complaints</Text>

            {complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.subject}</Text>
                <Text>{item.description}</Text>

                {item.attachment_url && (
                  <Image
                    source={{ uri: item.attachment_url }}
                    style={styles.cardImage}
                  />
                )}
 {item.admin_response && (
                  <View style={styles.adminBox}>
                    <Text style={styles.adminLabel}>Admin Response</Text>
                    <Text style={{ color: "#cd0000" }}>
                      {item.admin_response}
                    </Text>
                  </View>
                )}

                {!item.resolved_at && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.followUpTitle}>Continue This Complaint</Text>
                    <Text style={styles.followUpHint}>Send more context before admin marks it resolved.</Text>

                    <TextInput
                      placeholder="Add follow-up message"
                      placeholderTextColor="#888"
                      value={followUps[item.id] || ""}
                      onChangeText={(text) => setFollowUpText(item.id, text)}
                      style={styles.followUpInput}
                      multiline
                    />

                    <TouchableOpacity
                      style={styles.followUpButton}
                      onPress={() => sendFollowUp(item.id)}
                    >
                      <View style={styles.followUpButtonContent}>
                        <Ionicons name="send" size={15} color="#fff" />
                        <Text style={styles.followUpButtonText}>Send Follow-up</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteComplaint(item.id)}
                >
                  <Text style={{ color: "#fff" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    marginTop: 70,
    marginLeft: 25,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E6B0B0"
  },
  headerSub: {
    color: "#fff",
    marginTop: 4
  },
  formCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20
  },
  pickerWrapper: {
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    marginBottom: 10
  },
  picker: {
    color: "#4A1C22"
  },
  pickerItem: {
    color: "#4A1C22"
  },
  input: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6
  },
  imageBtn: {
    backgroundColor: "#E6B0B0",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  submitBtn: {
    backgroundColor: "#4A1C22",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E6B0B0",
    marginBottom: 10
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    marginVertical: 10
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4A1C22",
    marginBottom: 5
  },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 10
  },
  adminBox: {
    backgroundColor: "#ffecec",
    borderWidth: 1,
    borderColor: "#f5c6c6",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  followUpBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff3f3",
    borderWidth: 1,
    borderColor: "#f1d0d0",
  },
  followUpTitle: {
    color: "#6b2028",
    fontWeight: "700",
    fontSize: 13,
  },
  followUpHint: {
    marginTop: 4,
    marginBottom: 10,
    color: "#8d5c62",
    fontSize: 12,
  },
  followUpInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e3d2d2",
    padding: 12,
    borderRadius: 10,
    minHeight: 72,
    color: "#4A1C22",
    textAlignVertical: "top",
  },
  followUpButton: {
    marginTop: 10,
    backgroundColor: "#4A1C22",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6b2a33",
  },
  followUpButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followUpButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  adminLabel: { fontSize: 22,fontWeight: "bold", color: "#cd0000" },
  deleteBtn: {
    marginTop: 12,
    backgroundColor: "#d85b5b",
    padding: 10,
    borderRadius: 10,
    alignItems: "center"
  }
});
