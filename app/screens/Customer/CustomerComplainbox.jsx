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
const SPECIAL_ISSUES = [
  "Payment Issue",
  "Late Delivery",
  "Wrong Measurement",
  "Bad Stitching",
  "Misbehaviour",
];
const ISSUE_OPTIONS = [
  { label: "General", value: "General" },
  { label: "Payment Issue", value: "Payment Issue" },
  { label: "Late Delivery", value: "Late Delivery" },
  { label: "Wrong Measurement", value: "Wrong Measurement" },
  { label: "Bad Stitching", value: "Bad Stitching" },
  { label: "Misbehaviour", value: "Misbehaviour" },
  { label: "Other", value: "Other" },
];

export default function CustomerComplainBox({ route }) {
  const email = route.params?.email;

  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [followUps, setFollowUps] = useState({});

  const shouldShowFields = SPECIAL_ISSUES.includes(selectedIssue);

  const resetForm = () => {
    setAgainstEmail("");
    setOrderId("");
    setSelectedIssue("");
    setSubject("");
    setDescription("");
    setImage(null);
  };

  const setFollowUpText = (id, text) => {
    setFollowUps((prev) => ({ ...prev, [id]: text }));
  };

  const clearFollowUpText = (id) => {
    setFollowUps((prev) => ({ ...prev, [id]: "" }));
  };

  /* ================= IMAGE ================= */
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
    } catch (err) {
      Alert.alert("Error fetching complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ================= DELETE ================= */
  const deleteComplaint = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `${SERVER}/delete-complaint/${id}/${email}`
              );
              Alert.alert("Complaint deleted");
              fetchComplaints();
            } catch (err) {
              Alert.alert("Error deleting complaint");
            }
          }
        }
      ]
    );
  };

  /* ================= SUBMIT ================= */
  const submitComplaint = async () => {
    if (!subject || !description) {
      Alert.alert("Please fill required fields");
      return;
    }

    if (shouldShowFields && (!againstEmail || !orderId)) {
      Alert.alert("Tailor Email and Order ID are required for this issue");
      return;
    }

    const payload = {
      filed_by_email: email,
      filed_by_role: "customer",
      against_email: againstEmail || null,
      complaint_type: selectedIssue,
      subject,
      description,
      order_id: orderId || null,
      attachment_url: image || null
    };

    try {
      await axios.post(`${SERVER}/file-complaint`, payload);
      Alert.alert("Complaint submitted successfully");
      resetForm();
      fetchComplaints();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error submitting complaint";

      Alert.alert("Error", message);
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
    <View style={{ flex: 1, backgroundColor: "#0c1435" }}>
      <LinearGradient
        colors={["#1b254f", "#0c1435", "#080927"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Complaint Center</Text>
        <Text style={styles.headerSubtitle}>
          Raise concerns professionally
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>File a Complaint</Text>

          {shouldShowFields && (
            <>
              <TextInput
                placeholder="Enter Tailor Email *"
                placeholderTextColor="#667799"
                style={styles.input}
                value={againstEmail}
                onChangeText={setAgainstEmail}
              />
              <TextInput
                placeholder="Enter Order ID *"
                placeholderTextColor="#667799"
                style={styles.input}
                value={orderId}
                onChangeText={setOrderId}
              />
            </>
          )}

          <TextInput
            placeholder="Subject *"
            placeholderTextColor="#667799"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
          />

          <TextInput
            placeholder="Description *"
            placeholderTextColor="#667799"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 90 }]}
            multiline
          />

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedIssue}
              onValueChange={setSelectedIssue}
              dropdownIconColor="#c3d1ff"
              style={{ color: "#c3d1ff" }}
            >
              {ISSUE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} color="white" label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Upload Proof Image</Text>
          </TouchableOpacity>

          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}

          <TouchableOpacity style={styles.submitButton} onPress={submitComplaint}>
            <Text style={styles.submitText}>Submit Complaint</Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>My Complaints</Text>

          {complaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints filed yet.</Text>
          ) : (
            complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.subject}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: item.resolved_at
                          ? "#2e7d32"
                          : "#ff9800"
                      }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.resolved_at ? "Resolved" : "Pending"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>
                  {item.description}
                </Text>

                {item.attachment_url && (
                  <Image
                    source={{ uri: item.attachment_url }}
                    style={styles.cardImage}
                  />
                )}

                {item.admin_response && (
                  <View style={styles.adminBox}>
                    <Text style={styles.adminLabel}>Admin Response</Text>
                    <Text style={{ color: "#c3d1ff" }}>
                      {item.admin_response}
                    </Text>
                  </View>
                )}

                {!item.resolved_at && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.followUpTitle}>Continue This Complaint</Text>
                    <Text style={styles.followUpHint}>Share more details until admin resolves this issue.</Text>

                    <TextInput
                      placeholder="Add follow-up message"
                      placeholderTextColor="#667799"
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
                        <Ionicons name="send" size={15} color="#e6ebff" />
                        <Text style={styles.followUpButtonText}>Send Follow-up</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteComplaint(item.id)}
                >
                  <Text style={styles.deleteText}>
                    Remove Complaint
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  headerTitle: { color: "#d1d9ff", fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { color: "#8e9ccf", marginTop: 4 },
  formCard: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#d1d9ff"
  },
  input: {
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderWidth: 1,
    borderColor: "#506ba9",
    color: "#c3d1ff",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6
  },
  pickerWrapper: {
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderWidth: 1,
    borderColor: "#506ba9",
    borderRadius: 12,
    marginVertical: 6
  },
  imageButton: {
    backgroundColor: "#2a3c72",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  imageButtonText: { color: "#c3d1ff", fontWeight: "600" },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10
  },
  submitButton: {
    backgroundColor: "#2a3c72",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15
  },
  submitText: {
    color: "#e6ebff",
    fontWeight: "bold",
    fontSize: 16
  },
  card: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)",
    padding: 15,
    borderRadius: 20,
    marginVertical: 8
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#d1d9ff"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600"
  },
  cardDescription: { marginTop: 6, color: "#8e9ccf" },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 10
  },
  adminBox: {
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#506ba9"
  },
  adminLabel: { fontWeight: "bold", color: "#99aaff" },
  followUpBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(20, 28, 54, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.22)",
  },
  followUpTitle: {
    color: "#dbe4ff",
    fontWeight: "700",
    fontSize: 13,
  },
  followUpHint: {
    marginTop: 4,
    marginBottom: 10,
    color: "#9fb0e2",
    fontSize: 12,
  },
  followUpInput: {
    backgroundColor: "rgba(20, 28, 54, 0.8)",
    borderWidth: 1,
    borderColor: "#506ba9",
    color: "#c3d1ff",
    padding: 12,
    borderRadius: 10,
    minHeight: 72,
    textAlignVertical: "top",
  },
  followUpButton: {
    marginTop: 10,
    backgroundColor: "#2a3c72",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.25)",
  },
  followUpButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followUpButtonText: {
    color: "#e6ebff",
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "#7a1f2b",
    padding: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  deleteText: { color: "white", fontWeight: "600" },
  emptyText: { color: "#889acc", marginTop: 10 }
});
