import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SERVER = "https://tailorx-production.up.railway.app";
const SPECIAL_ISSUES = ["Payment Issue", "Late Delivery", "Wrong Measurement", "Bad Stitching", "Misbehaviour"];
const ISSUE_OPTIONS = [
  { label: "General", value: "General" },
  { label: "Payment Issue", value: "Payment Issue" },
  { label: "Late Delivery", value: "Late Delivery" },
  { label: "Wrong Measurement", value: "Wrong Measurement" },
  { label: "Bad Stitching", value: "Bad Stitching" },
  { label: "Misbehaviour", value: "Misbehaviour" },
  { label: "Other", value: "Other" },
];

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

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

  const resetForm = () => { setAgainstEmail(""); setOrderId(""); setSelectedIssue(""); setSubject(""); setDescription(""); setImage(null); };
  const setFollowUpText = (id, text) => setFollowUps((prev) => ({ ...prev, [id]: text }));
  const clearFollowUpText = (id) => setFollowUps((prev) => ({ ...prev, [id]: "" }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/complaints/my-complaints/${email}`);
      setComplaints(res.data);
    } catch { Alert.alert("Error fetching complaints"); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const deleteComplaint = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this complaint?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/complaints/delete-complaint/${id}/${email}`);
            Alert.alert("Complaint deleted");
            fetchComplaints();
          } catch { Alert.alert("Error deleting complaint"); }
        },
      },
    ]);
  };

  const submitComplaint = async () => {
    if (!subject || !description) { Alert.alert("Please fill required fields"); return; }
    if (shouldShowFields && (!againstEmail || !orderId)) { Alert.alert("Tailor Email and Order ID are required for this issue"); return; }
    const payload = { filed_by_email: email, filed_by_role: "customer", against_email: againstEmail || null, complaint_type: selectedIssue, subject, description, order_id: orderId || null, attachment_url: image || null };
    try {
      await axios.post(`${SERVER}/complaints/file-complaint`, payload);
      Alert.alert("Complaint submitted successfully");
      resetForm(); fetchComplaints();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || err.response?.data?.message || "Error submitting complaint");
    }
  };

  const sendFollowUp = async (complaintId) => {
    const message = String(followUps[complaintId] || "").trim();
    if (!message) { Alert.alert("Write a message first"); return; }
    try {
      await axios.post(`${SERVER}/complaints/follow-up`, { complaint_id: complaintId, filed_by_email: email, message });
      clearFollowUpText(complaintId); fetchComplaints(); Alert.alert("Follow-up sent");
    } catch (err) { Alert.alert("Error", err.response?.data?.error || "Could not send follow-up"); }
  };

  const StyledInput = ({ placeholder, value, onChangeText, multiline, icon }) => (
    <View style={styles.inputWrap}>
      {icon && <Ionicons name={icon} size={16} color="#E6B0B0" style={styles.inputIcon} />}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={[styles.input, multiline && { height: 90, textAlignVertical: "top" }, icon && { paddingLeft: 36 }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </View>
  );

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <LinearGradient
        colors={["rgba(157,42,75,0.3)", "rgba(0,0,0,0)"]}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="shield-half-outline" size={24} color="#E6B0B0" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Complaint Center</Text>
            <Text style={styles.headerSubtitle}>Raise concerns professionally</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FORM */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>File a Complaint</Text>
          </View>

          {shouldShowFields && (
            <>
              <StyledInput placeholder="Tailor Email *" value={againstEmail} onChangeText={setAgainstEmail} icon="mail-outline" />
              <StyledInput placeholder="Order ID *" value={orderId} onChangeText={setOrderId} icon="receipt-outline" />
            </>
          )}

          <StyledInput placeholder="Subject *" value={subject} onChangeText={setSubject} icon="document-text-outline" />
          <StyledInput placeholder="Description *" value={description} onChangeText={setDescription} multiline icon="create-outline" />

          <View style={styles.pickerWrapper}>
            <Ionicons name="options-outline" size={16} color="#E6B0B0" style={styles.pickerIcon} />
            <Picker selectedValue={selectedIssue} onValueChange={setSelectedIssue} dropdownIconColor="#E6B0B0" style={styles.picker}>
              {ISSUE_OPTIONS.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} color={Platform.OS === "android" ? "#fff" : "#E6B0B0"} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImage} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={18} color="#E6B0B0" style={{ marginRight: 8 }} />
            <Text style={styles.imageButtonText}>{image ? "Change Proof Image" : "Upload Proof Image"}</Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={submitComplaint} activeOpacity={0.85} style={{ marginTop: 10 }}>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.submitButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit Complaint</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>My Complaints</Text>
          </View>

          {complaints.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#E6B0B0" />
              <Text style={styles.emptyText}>No complaints filed yet.</Text>
            </View>
          ) : (
            complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.resolved_at ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", borderColor: item.resolved_at ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)" }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.resolved_at ? "#10b981" : "#f59e0b" }]} />
                    <Text style={[styles.statusText, { color: item.resolved_at ? "#10b981" : "#f59e0b" }]}>
                      {item.resolved_at ? "Resolved" : "Pending"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>{item.description}</Text>

                {item.attachment_url && (
                  <Image source={{ uri: item.attachment_url }} style={styles.cardImage} />
                )}

                {item.admin_response && (
                  <View style={styles.adminBox}>
                    <View style={styles.adminLabel}>
                      <Ionicons name="shield-checkmark" size={14} color="#E6B0B0" style={{ marginRight: 6 }} />
                      <Text style={styles.adminLabelText}>Admin Response</Text>
                    </View>
                    <Text style={styles.adminResponse}>{item.admin_response}</Text>
                  </View>
                )}

                {!item.resolved_at && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.followUpTitle}>Continue This Complaint</Text>
                    <Text style={styles.followUpHint}>Share more details until admin resolves this issue.</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        placeholder="Add follow-up message"
                        placeholderTextColor="#4b5563"
                        value={followUps[item.id] || ""}
                        onChangeText={(text) => setFollowUpText(item.id, text)}
                        style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
                        multiline
                      />
                    </View>
                    <TouchableOpacity style={styles.followUpButton} onPress={() => sendFollowUp(item.id)} activeOpacity={0.85}>
                      <Ionicons name="send" size={14} color="#E6B0B0" style={{ marginRight: 6 }} />
                      <Text style={styles.followUpButtonText}>Send Follow-up</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteComplaint(item.id)}>
                  <Ionicons name="trash-outline" size={14} color="#f87171" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteText}>Remove Complaint</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSubtitle: { color: "#E6B0B0", marginTop: 2, fontSize: 13, fontWeight: "600" },
  scrollContent: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 50, paddingTop: 18, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  formCard: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    margin: 20, padding: 20, borderRadius: 22,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.2)",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  listSection: { paddingHorizontal: 20, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionDot: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  inputWrap: { position: "relative", marginVertical: 6 },
  inputIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },
  pickerIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },
  input: {
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    color: "#fff", padding: 12,
    borderRadius: 14, fontSize: 14,
  },
  pickerWrapper: {
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    borderRadius: 14, marginVertical: 6, paddingLeft: 2,
  },
  picker: { color: "#fff" },
  imageButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(157,42,75,0.15)",
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    justifyContent: "center", marginTop: 8,
  },
  imageButtonText: { color: "#E6B0B0", fontWeight: "700", fontSize: 14 },
  previewWrap: { position: "relative", marginTop: 10 },
  previewImage: { width: "100%", height: 180, borderRadius: 14 },
  removeImgBtn: { position: "absolute", top: -10, right: -10 },
  submitButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 16,
    shadowColor: "#9D2A4B", shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  card: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.18)",
    padding: 16, borderRadius: 20, marginVertical: 8,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontWeight: "800", fontSize: 15, color: "#fff", flex: 1, marginRight: 10 },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "700" },
  cardDescription: { color: "#E6B0B0", fontSize: 14, lineHeight: 20 },
  cardImage: { width: "100%", height: 150, borderRadius: 12, marginTop: 10 },
  adminBox: {
    backgroundColor: "rgba(157,42,75,0.1)", padding: 12,
    borderRadius: 12, marginTop: 12,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
  },
  adminLabel: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  adminLabelText: { fontWeight: "700", color: "#E6B0B0", fontSize: 13 },
  adminResponse: { color: "#fff", fontSize: 14 },
  followUpBox: {
    marginTop: 12, padding: 14, borderRadius: 14,
    backgroundColor: "rgba(26, 6, 16, 0.3)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.22)",
  },
  followUpTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  followUpHint: { marginTop: 4, marginBottom: 10, color: "#E6B0B0", fontSize: 12 },
  followUpButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 10, backgroundColor: "rgba(157,42,75,0.15)",
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.35)",
  },
  followUpButtonText: { color: "#E6B0B0", fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 12, backgroundColor: "rgba(239,68,68,0.1)",
    padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
  },
  deleteText: { color: "#f87171", fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", padding: 30 },
  emptyText: { color: "#E6B0B0", marginTop: 10, fontSize: 15, fontWeight: "600" },
});
