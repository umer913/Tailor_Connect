import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { resolveImageUrl } from "../../api.js";

const API_BASE_URL = "https://tailorx-production.up.railway.app:3001";
const CUSTOMER_ROLE = "customer";
const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 16;

const formatTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const getConversationPreview = (item) => item.last_message || (item.last_image_url ? "📷 Image" : "No messages yet");

const CustomerChatbox = ({ route }) => {
  const params = route?.params || {};
  const customerEmail = params.CustomerEmail || params.customerEmail || params.email || "";
  const routeTailorEmail = params.tailorEmail || "";
  const routeTailorName = params.tailorName || "";

  const [customerName, setCustomerName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [sending, setSending] = useState(false);

  const fetchCustomerName = useCallback(async () => {
    if (!customerEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/profiles/get-profile`, { params: { email: customerEmail } });
      setCustomerName(res.data?.user?.full_name || "Customer");
    } catch { setCustomerName("Customer"); }
  }, [customerEmail]);

  const fetchConversations = useCallback(async (showLoader = true) => {
    if (!customerEmail) { setConversations([]); setLoadingConversations(false); return; }
    if (showLoader) setLoadingConversations(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/chat-conversations`, { params: { email: customerEmail, role: CUSTOMER_ROLE } });
      setConversations(res.data?.conversations || []);
    } catch { if (showLoader) setConversations([]); }
    finally { if (showLoader) setLoadingConversations(false); }
  }, [customerEmail]);

  const fetchMessages = useCallback(async (conversation, showLoader = true) => {
    if (!conversation?.tailor_email || !customerEmail) return;
    if (showLoader) setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/chat-messages`, { params: { tailor_email: conversation.tailor_email, customer_email: customerEmail, viewer_role: CUSTOMER_ROLE } });
      setMessages(res.data?.messages || []);
    } finally { if (showLoader) setLoadingMessages(false); }
  }, [customerEmail]);

  useEffect(() => { fetchCustomerName(); fetchConversations(); }, [fetchCustomerName, fetchConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConversation) fetchMessages(activeConversation, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConversation, fetchConversations, fetchMessages]);

  const routeConversation = routeTailorEmail && customerEmail ? { conversation_id: `${routeTailorEmail}::${customerEmail}`, tailor_email: routeTailorEmail, customer_email: customerEmail, tailor_name: routeTailorName || "Tailor", customer_name: customerName || "Customer", last_message: "", unread_count: 0 } : null;
  const hasRouteConversationInList = !routeConversation || conversations.some((i) => i.tailor_email === routeConversation.tailor_email && i.customer_email === routeConversation.customer_email);

  const resetComposer = () => { setMessageText(""); setSelectedImageUri(""); };
  const closeConversation = () => { setActiveConversation(null); setMessages([]); resetComposer(); };
  const openConversation = async (conv) => { setActiveConversation(conv); setMessages([]); await fetchMessages(conv, true); };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;
    setSelectedImageUri(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!selectedImageUri) return null;
    const fileName = selectedImageUri.split("/").pop() || `chat_${Date.now()}.jpg`;
    const ext = fileName.split(".").pop() || "jpg";
    const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const formData = new FormData();
    formData.append("image", { uri: selectedImageUri, type: mimeType, name: fileName });
    try {
      const res = await axios.post(`${API_BASE_URL}/chat/chat-upload-image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data?.image_url || null;
    } catch (error) { throw new Error(error?.response?.data?.error || "Failed to upload image"); }
  };

  const sendMessage = async () => {
    if (!activeConversation || sending) return;
    const cleanMsg = messageText.trim();
    if (!cleanMsg && !selectedImageUri) return;
    setSending(true);
    try {
      const imageUrl = await uploadImage();
      await axios.post(`${API_BASE_URL}/chat/chat-send-message`, { tailor_email: activeConversation.tailor_email, customer_email: customerEmail, tailor_name: activeConversation.tailor_name || "Tailor", customer_name: customerName || "Customer", sender_role: CUSTOMER_ROLE, message: cleanMsg, image_url: imageUrl });
      resetComposer();
      await fetchMessages(activeConversation, false);
      await fetchConversations(false);
    } catch (error) { Alert.alert("Message not sent", error?.response?.data?.error || error?.message || "Failed to send message"); }
    finally { setSending(false); }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} activeOpacity={0.86} onPress={() => openConversation(item)}>
      <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.conversationAvatar}>
        <Ionicons name="cut" size={18} color="#fff" />
      </LinearGradient>
      <View style={styles.conversationBody}>
        <Text style={styles.conversationName} numberOfLines={1}>{item.tailor_name || "Tailor"}</Text>
        <Text style={styles.conversationPreview} numberOfLines={1}>{getConversationPreview(item)}</Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={styles.conversationTime}>{formatTime(item.last_datetime)}</Text>
        {item.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => {
    const isMine = item.sender_role === "customer";
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        {!isMine && (
          <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.msgAvatar}>
            <Ionicons name="cut" size={12} color="#fff" />
          </LinearGradient>
        )}
        <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
          {item.image_url ? <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.messageImage} /> : null}
          {item.message ? <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.message}</Text> : null}
          <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>{formatTime(item.datetime)}</Text>
        </View>
      </View>
    );
  };

  if (!customerEmail) {
    return (
      <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Unable to open chat</Text>
          <Text style={styles.emptyText}>Missing customer email.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {!activeConversation ? (
        <View style={styles.screenContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSub}>{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchConversations(true)}>
              <Ionicons name="refresh-outline" size={18} color="#E6B0B0" />
            </TouchableOpacity>
          </View>

          {/* Quick-start card */}
          {routeConversation && !hasRouteConversationInList ? (
            <TouchableOpacity style={styles.quickStartCard} activeOpacity={0.86} onPress={() => openConversation(routeConversation)}>
              <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.quickStartIcon}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              </LinearGradient>
              <View style={styles.quickStartTextWrap}>
                <Text style={styles.quickStartTitle}>Start chat with {routeConversation.tailor_name}</Text>
                <Text style={styles.quickStartSubtitle}>Tap to open this conversation</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#E6B0B0" />
            </TouchableOpacity>
          ) : null}

          {loadingConversations ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#9D2A4B" />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.centerContent}>
              <LinearGradient colors={["rgba(157,42,75,0.25)", "rgba(214,64,106,0.1)"]} style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-outline" size={38} color="#E6B0B0" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>Open a tailor's profile and tap the chat icon to start a conversation.</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.conversation_id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.conversationList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.screenContent} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}>
          {/* Thread Header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity style={styles.backButton} onPress={closeConversation}>
              <Ionicons name="chevron-back" size={20} color="#E6B0B0" />
            </TouchableOpacity>
            <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.threadAvatar}>
              <Ionicons name="cut" size={16} color="#fff" />
            </LinearGradient>
            <View style={styles.threadHeaderTextWrap}>
              <Text style={styles.threadTitle}>{activeConversation.tailor_name || "Tailor"}</Text>
              <Text style={styles.threadSubtitle}>{activeConversation.tailor_email}</Text>
            </View>
          </View>

          {loadingMessages ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#9D2A4B" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {selectedImageUri ? (
            <View style={styles.selectedImageRow}>
              <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImageUri("")}>
                <Ionicons name="close-circle" size={22} color="#f87171" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.iconActionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={19} color="#E6B0B0" />
            </TouchableOpacity>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type your message..."
              placeholderTextColor="#6b7280"
              style={styles.input}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.sendGrad}>
                  <Ionicons name="send" size={16} color="#fff" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenContent: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 62 : 42,
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 14,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSub: { color: "#E6B0B0", fontSize: 13, fontWeight: "600", marginTop: 2 },
  refreshButton: {
    width: 42, height: 42, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    backgroundColor: "rgba(157,42,75,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  quickStartCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1,
    borderColor: "rgba(157,42,75,0.3)",
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  quickStartIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickStartTextWrap: { marginLeft: 12, flex: 1 },
  quickStartTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  quickStartSubtitle: { color: "#E6B0B0", fontSize: 12, marginTop: 2 },
  conversationList: { paddingBottom: 12, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  conversationItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    borderRadius: 18, borderWidth: 1, borderColor: "rgba(157,42,75,0.18)",
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
  },
  conversationAvatar: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  conversationBody: { flex: 1, marginLeft: 12 },
  conversationName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  conversationPreview: { color: "#E6B0B0", fontSize: 13, marginTop: 3 },
  conversationMeta: { alignItems: "flex-end", marginLeft: 8 },
  conversationTime: { color: "#E6B0B0", fontSize: 11, fontWeight: "600" },
  unreadBadge: {
    marginTop: 6, minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: "#9D2A4B", alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 12 },
  emptyText: { color: "#E6B0B0", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  threadHeader: {
    flexDirection: "row", alignItems: "center",
    paddingBottom: 14, borderBottomWidth: 1,
    borderBottomColor: "rgba(230,176,176,0.08)", marginBottom: 10,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  threadAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  threadHeaderTextWrap: { marginLeft: 10, flex: 1 },
  threadTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  threadSubtitle: { color: "#E6B0B0", fontSize: 12, marginTop: 2 },
  messageList: { paddingBottom: 8, flexGrow: 1, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  messageRow: { marginBottom: 10, flexDirection: "row", alignItems: "flex-end" },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  msgAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 6 },
  messageBubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  messageBubbleMine: { backgroundColor: "rgba(157,42,75,0.25)", borderColor: "rgba(157,42,75,0.4)", borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: "rgba(26, 6, 16, 0.7)", borderColor: "rgba(157,42,75,0.18)", borderBottomLeftRadius: 4 },
  messageImage: { width: 190, height: 190, borderRadius: 12, marginBottom: 8 },
  messageText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: "#fff" },
  messageTime: { color: "#E6B0B0", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  messageTimeMine: { color: "rgba(230,176,176,0.6)" },
  selectedImageRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  selectedImagePreview: { width: 64, height: 64, borderRadius: 12, borderWidth: 1, borderColor: "rgba(157,42,75,0.3)" },
  removeImageButton: { marginLeft: 8 },
  inputRow: {
    marginBottom: Platform.OS === "ios" ? 10 : 20,
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: "rgba(26, 6, 16, 0.8)",
    borderRadius: 18, borderWidth: 1, borderColor: "rgba(157,42,75,0.25)", padding: 8,
  },
  iconActionButton: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(157,42,75,0.1)",
  },
  input: { flex: 1, color: "#fff", fontSize: 14, maxHeight: 90, paddingHorizontal: 10, paddingVertical: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 12, overflow: "hidden" },
  sendGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
});

export default CustomerChatbox;
