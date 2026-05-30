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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SERVER = "https://tailorx-production.up.railway.app:3001";
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

const STATUS_COLORS = {
  open: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  resolved: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
  pending: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
};

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/complaints/my-complaints/${email}`);
      setComplaints(res.data);
    } catch {
      Alert.alert("Error fetching complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const deleteComplaint = async (id) => {
    Alert.alert("Delete Complaint", "Are you sure you want to remove this complaint?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/complaints/delete-complaint/${id}/${email}`);
            fetchComplaints();
          } catch {
            Alert.alert("Error deleting complaint");
          }
        }
      }
    ]);
  };

  const submitComplaint = async () => {
    if (!subject || !description) {
      Alert.alert("Please fill required fields");
      return;
    }
    if (shouldRequireTargetFields) {
      if (!againstEmail || !orderId) {
        Alert.alert("Customer Email and Order ID are required for this complaint type");
        return;
      }
    }
    try {
      await axios.post(`${SERVER}/complaints/file-complaint`, {
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

  return (
    <LinearGradient colors={["#050811", "#0b1220", "#141c30"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="megaphone" size={22} color="#F59E0B" />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.headerSub}>Raise a concern</Text>
            <Text style={styles.headerTitle}>Complaint Center</Text>
          </View>
        </View>

        {/* FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>New Complaint</Text>

          {/* Complaint Type */}
          <Text style={styles.fieldLabel}>Complaint Type</Text>
          <View style={styles.pickerWrapper}>

            <Picker
              selectedValue={complaintType}
              onValueChange={setComplaintType}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#ffffff"
            >
              {COMPLAINT_TYPE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} color="#ffffff" />
              ))}
            </Picker>
          </View>

          {/* Conditional Fields */}
          {shouldRequireTargetFields && (
            <>
              <Text style={styles.fieldLabel}>Customer Email *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#F59E0B" style={styles.inputIcon} />
                <TextInput
                  placeholder="customer@email.com"
                  placeholderTextColor="#94a3b8"
                  style={styles.inputWithIcon}
                  value={againstEmail}
                  onChangeText={setAgainstEmail}
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.fieldLabel}>Order ID *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="receipt-outline" size={16} color="#F59E0B" style={styles.inputIcon} />
                <TextInput
                  placeholder="Order ID"
                  placeholderTextColor="#94a3b8"
                  style={styles.inputWithIcon}
                  value={orderId}
                  onChangeText={setOrderId}
                />
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Subject *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="text-outline" size={16} color="#F59E0B" style={styles.inputIcon} />
            <TextInput
              placeholder="Brief subject line"
              placeholderTextColor="#94a3b8"
              style={styles.inputWithIcon}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            placeholder="Describe your complaint in detail..."
            placeholderTextColor="#94a3b8"
            style={styles.textArea}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.imageBtn} onPress={pickImage} activeOpacity={0.85}>
            <Ionicons name="camera-outline" size={18} color="#F59E0B" />
            <Text style={styles.imageBtnText}>Upload Proof Image</Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.previewImageWrap}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImage(null)}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={submitComplaint} activeOpacity={0.88}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.submitBtnGradient}>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Complaint</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* MY COMPLAINTS */}
        {complaints.length > 0 && (
          <View style={styles.complaintsSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="folder-open-outline" size={16} color="#F59E0B" /> My Complaints ({complaints.length})
            </Text>

            {complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="document-text-outline" size={16} color="#F59E0B" />
                    <Text style={styles.cardTitle}>{item.subject}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteComplaint(item.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardDescription}>{item.description}</Text>

                {item.attachment_url && (
                  <Image source={{ uri: item.attachment_url }} style={styles.cardImage} />
                )}

                {item.admin_response && (
                  <View style={styles.adminBox}>
                    <View style={styles.adminLabelRow}>
                      <Ionicons name="shield-checkmark-outline" size={14} color="#EF4444" />
                      <Text style={styles.adminLabel}>Admin Response</Text>
                    </View>
                    <Text style={styles.adminResponseText}>{item.admin_response}</Text>
                  </View>
                )}

                {!item.resolved_at && (
                  <View style={styles.followUpBox}>
                    <View style={styles.followUpHeaderRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#F59E0B" />
                      <Text style={styles.followUpTitle}>Continue This Complaint</Text>
                    </View>
                    <Text style={styles.followUpHint}>Add more context before admin resolves it.</Text>

                    <TextInput
                      placeholder="Add follow-up message..."
                      placeholderTextColor="#94a3b8"
                      value={followUps[item.id] || ""}
                      onChangeText={(text) => setFollowUpText(item.id, text)}
                      style={styles.followUpInput}
                      multiline
                    />

                    <TouchableOpacity
                      style={styles.followUpButton}
                      onPress={() => sendFollowUp(item.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="send" size={14} color="#fff" />
                      <Text style={styles.followUpButtonText}>Send Follow-up</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 50,
    paddingHorizontal: PAGE_GUTTER,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 68,
    marginBottom: 24,
    paddingHorizontal: 0,
    width: '100%',
  },

  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },

  formCard: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    marginHorizontal: 0,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  formCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 18,
    letterSpacing: -0.2,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
    marginTop: 4,
  },

  pickerWrapper: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
  },

  pickerIcon: { marginLeft: 12 },

  picker: { flex: 1, color: "#ffffff" },
  pickerItem: { color: "#ffffff" },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingRight: 12,
  },

  inputIcon: { marginLeft: 12 },

  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontSize: 14,
    color: '#ffffff',
  },

  textArea: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 14,
    color: '#ffffff',
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 13,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderStyle: 'dashed',
  },

  imageBtnText: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 14,
  },

  previewImageWrap: {
    position: 'relative',
    marginBottom: 14,
  },

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },

  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 11,
  },

  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },

  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  submitBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  complaintsSection: {
    paddingHorizontal: 0,
    marginBottom: 20,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  cardTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#ffffff",
    flex: 1,
  },

  cardDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },

  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    marginBottom: 12,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  adminBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  adminLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  adminLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FCA5A5",
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  adminResponseText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 19,
  },

  followUpBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },

  followUpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  followUpTitle: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 13,
  },

  followUpHint: {
    marginBottom: 12,
    color: "#94a3b8",
    fontSize: 12,
  },

  followUpInput: {
    backgroundColor: "rgba(59, 130, 246, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.15)",
    padding: 12,
    borderRadius: 12,
    minHeight: 72,
    color: "#ffffff",
    textAlignVertical: "top",
    fontSize: 14,
  },

  followUpButton: {
    marginTop: 10,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  followUpButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
