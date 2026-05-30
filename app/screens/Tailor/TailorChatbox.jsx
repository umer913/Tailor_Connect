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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { resolveImageUrl } from "../../api.js";

const SCREEN_W = Dimensions.get('window').width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 1040 : IS_TABLET ? 860 : SCREEN_W;

const API_BASE_URL = "https://tailorx-production.up.railway.app";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const TailorChatbox = ({ route }) => {
  const tailorEmail = route?.params?.email || route?.params?.TailorEmail || route?.params?.tailorEmail || "";

  const [tailorName, setTailorName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTailorName = useCallback(async () => {
    if (!tailorEmail) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/profiles/get-profile`, { params: { email: tailorEmail } });
      setTailorName(response.data?.user?.full_name || "Tailor");
    } catch {
      setTailorName("Tailor");
    }
  }, [tailorEmail]);

  const fetchConversations = useCallback(async (showLoader = true) => {
    if (!tailorEmail) { setConversations([]); setLoadingConversations(false); return; }
    if (showLoader) setLoadingConversations(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/chat-conversations`, {
        params: { email: tailorEmail, role: "tailor" },
      });
      setConversations(response.data?.conversations || []);
    } catch {
      if (showLoader) setConversations([]);
    } finally {
      if (showLoader) setLoadingConversations(false);
    }
  }, [tailorEmail]);

  const fetchMessages = useCallback(async (conversation, showLoader = true) => {
    if (!conversation?.customer_email || !tailorEmail) return;
    if (showLoader) setLoadingMessages(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/chat-messages`, {
        params: { tailor_email: tailorEmail, customer_email: conversation.customer_email, viewer_role: "tailor" },
      });
      setMessages(response.data?.messages || []);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  }, [tailorEmail]);

  useEffect(() => {
    fetchTailorName();
    fetchConversations();
  }, [fetchTailorName, fetchConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConversation) fetchMessages(activeConversation, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConversation, fetchConversations, fetchMessages]);

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    await fetchMessages(conversation, true);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    setSelectedImageUri(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!selectedImageUri) return null;
    const fileName = selectedImageUri.split("/").pop() || `chat_${Date.now()}.jpg`;
    const extension = fileName.split(".").pop() || "jpg";
    const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
    const formData = new FormData();
    formData.append("image", { uri: selectedImageUri, type: mimeType, name: fileName });
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/chat-upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data?.image_url || null;
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to upload image";
      throw new Error(message);
    }
  };

  const sendMessage = async () => {
    if (!activeConversation || sending) return;
    const cleanMessage = messageText.trim();
    if (!cleanMessage && !selectedImageUri) return;
    setSending(true);
    try {
      const imageUrl = await uploadImage();
      await axios.post(`${API_BASE_URL}/chat/chat-send-message`, {
        tailor_email: tailorEmail,
        customer_email: activeConversation.customer_email,
        tailor_name: tailorName || activeConversation.tailor_name || "Tailor",
        customer_name: activeConversation.customer_name || "Customer",
        sender_role: "tailor",
        message: cleanMessage,
        image_url: imageUrl,
      });
      setMessageText("");
      setSelectedImageUri("");
      await fetchMessages(activeConversation, false);
      await fetchConversations(false);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Failed to send message";
      Alert.alert("Message not sent", message);
    } finally {
      setSending(false);
    }
  };

  const renderConversationItem = ({ item }) => {
    const previewText = item.last_message || (item.last_image_url ? "📷 Image" : "No messages yet");
    const initials = (item.customer_name || "C").charAt(0).toUpperCase();

    return (
      <TouchableOpacity style={styles.conversationItem} activeOpacity={0.86} onPress={() => openConversation(item)}>
        <View style={styles.conversationAvatar}>
          <Text style={styles.conversationAvatarText}>{initials}</Text>
        </View>

        <View style={styles.conversationBody}>
          <Text style={styles.conversationName} numberOfLines={1}>{item.customer_name || "Customer"}</Text>
          <Text style={styles.conversationPreview} numberOfLines={1}>{previewText}</Text>
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
  };

  const renderMessageItem = ({ item }) => {
    const isMine = item.sender_role === "tailor";
    const isSystemUnknown = !item.sender_role;

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther, isSystemUnknown && styles.messageRowUnknown]}>
        <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther, isSystemUnknown && styles.messageBubbleUnknown]}>
          {item.image_url ? <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.messageImage} /> : null}
          {item.message ? <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.message}</Text> : null}
          <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>{formatTime(item.datetime)}</Text>
        </View>
      </View>
    );
  };

  if (!tailorEmail) {
    return (
      <LinearGradient colors={["#050811", "#0b1220", "#141c30"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={50} color="rgba(148, 163, 184, 0.4)" />
          <Text style={styles.emptyTitle}>Unable to open chat</Text>
          <Text style={styles.emptyText}>Missing tailor email in navigation params.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#050811", "#0b1220", "#141c30"]} style={styles.container}>
      {!activeConversation ? (
        <View style={styles.screenContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSub}>Messages</Text>
              <Text style={styles.headerTitle}>Tailor Chat</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchConversations(true)} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          {loadingConversations ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.centerContent}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={44} color="rgba(148, 163, 184, 0.4)" />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>Customer messages will appear here.</Text>
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
        <KeyboardAvoidingView
          style={styles.screenContent}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          {/* Thread Header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setActiveConversation(null); setMessages([]); setMessageText(""); setSelectedImageUri(""); }}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={20} color="#F59E0B" />
            </TouchableOpacity>

            <View style={styles.threadAvatarSmall}>
              <Text style={styles.threadAvatarText}>
                {(activeConversation.customer_name || "C").charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.threadHeaderTextWrap}>
              <Text style={styles.threadTitle}>{activeConversation.customer_name || "Customer"}</Text>
              <Text style={styles.threadSubtitle}>{activeConversation.customer_email}</Text>
            </View>
          </View>

          {loadingMessages ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#F59E0B" />
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
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImageUri("")} activeOpacity={0.85}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.iconActionButton} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="image-outline" size={20} color="#F59E0B" />
            </TouchableOpacity>

            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="rgba(148, 163, 184, 0.5)"
              style={styles.input}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              activeOpacity={0.85}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={17} color="#fff" />
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  conversationList: { paddingBottom: 12 },

  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    width: '100%',
  },

  conversationAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: "center",
    justifyContent: "center",
  },

  conversationAvatarText: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '800',
  },

  conversationBody: { flex: 1, marginLeft: 12 },

  conversationName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },

  conversationPreview: {
    color: "#94a3b8",
    fontSize: 13,
  },

  conversationMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
    gap: 6,
  },

  conversationTime: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  unreadBadgeText: {
    color: "#050811",
    fontSize: 11,
    fontWeight: "800",
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
  },

  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  /* Thread */
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59, 130, 246, 0.15)",
    marginBottom: 12,
    gap: 10,
    width: '100%',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  threadAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  threadAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  threadHeaderTextWrap: {
    flex: 1,
  },

  threadTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  threadSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 1,
  },

  messageList: {
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageRow: {
    marginBottom: 8,
    flexDirection: "row",
  },

  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageRowUnknown: { justifyContent: "center" },

  messageBubble: {
    maxWidth: SCREEN_W >= 1024 ? 560 : "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  messageBubbleMine: {
    backgroundColor: "#1E3A8A",
  },

  messageBubbleOther: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },

  messageBubbleUnknown: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },

  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },

  messageText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },

  messageTextMine: {
    color: "#ffffff",
  },

  messageTime: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  messageTimeMine: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  selectedImageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },

  selectedImagePreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },

  removeImageButton: {},

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },

  iconActionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },

  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    maxHeight: 90,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
  },

  sendButtonDisabled: { opacity: 0.55 },
});

export default TailorChatbox;
