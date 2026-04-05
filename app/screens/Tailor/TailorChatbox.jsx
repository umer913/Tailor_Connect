import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const API_BASE_URL = "http://UF-MacBook-Pro.local:3000";

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

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
    if (!tailorEmail) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/get-profile`, {
        params: { email: tailorEmail },
      });
      setTailorName(response.data?.user?.full_name || "Tailor");
    } catch {
      setTailorName("Tailor");
    }
  }, [tailorEmail]);

  const fetchConversations = useCallback(
    async (showLoader = true) => {
      if (!tailorEmail) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      if (showLoader) {
        setLoadingConversations(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/chat-conversations`, {
          params: {
            email: tailorEmail,
            role: "tailor",
          },
        });

        setConversations(response.data?.conversations || []);
      } catch {
        if (showLoader) {
          setConversations([]);
        }
      } finally {
        if (showLoader) {
          setLoadingConversations(false);
        }
      }
    },
    [tailorEmail]
  );

  const fetchMessages = useCallback(
    async (conversation, showLoader = true) => {
      if (!conversation?.customer_email || !tailorEmail) {
        return;
      }

      if (showLoader) {
        setLoadingMessages(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/chat-messages`, {
          params: {
            tailor_email: tailorEmail,
            customer_email: conversation.customer_email,
            viewer_role: "tailor",
          },
        });

        setMessages(response.data?.messages || []);
      } finally {
        if (showLoader) {
          setLoadingMessages(false);
        }
      }
    },
    [tailorEmail]
  );

  useEffect(() => {
    fetchTailorName();
    fetchConversations();
  }, [fetchTailorName, fetchConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConversation) {
        fetchMessages(activeConversation, false);
      }
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
    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSelectedImageUri(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!selectedImageUri) {
      return null;
    }

    const fileName = selectedImageUri.split("/").pop() || `chat_${Date.now()}.jpg`;
    const extension = fileName.split(".").pop() || "jpg";
    const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImageUri,
      type: mimeType,
      name: fileName,
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/chat-upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data?.image_url || null;
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to upload image";
      throw new Error(message);
    }
  };

  const sendMessage = async () => {
    if (!activeConversation || sending) {
      return;
    }

    const cleanMessage = messageText.trim();
    if (!cleanMessage && !selectedImageUri) {
      return;
    }

    setSending(true);

    try {
      const imageUrl = await uploadImage();

      await axios.post(`${API_BASE_URL}/chat-send-message`, {
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
    const previewText = item.last_message || (item.last_image_url ? "Image" : "No messages yet");

    return (
      <TouchableOpacity style={styles.conversationItem} activeOpacity={0.86} onPress={() => openConversation(item)}>
        <View style={styles.conversationAvatar}>
          <Ionicons name="person-outline" size={18} color="#4A1C22" />
        </View>

        <View style={styles.conversationBody}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.customer_name || "Customer"}
          </Text>
          <Text style={styles.conversationPreview} numberOfLines={1}>
            {previewText}
          </Text>
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
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowOther,
          isSystemUnknown && styles.messageRowUnknown,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
            isSystemUnknown && styles.messageBubbleUnknown,
          ]}>
          {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.messageImage} /> : null}

          {item.message ? <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.message}</Text> : null}

          <Text style={styles.messageTime}>{formatTime(item.datetime)}</Text>
        </View>
      </View>
    );
  };

  if (!tailorEmail) {
    return (
      <LinearGradient colors={["#2B0F14", "#3A1419", "#4A1C22"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Unable to open chat</Text>
          <Text style={styles.emptyText}>Missing tailor email in navigation params.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#2B0F14", "#3A1419", "#4A1C22"]} style={styles.container}>
      {!activeConversation ? (
        <View style={styles.screenContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Tailor Chat</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchConversations(true)} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#4A1C22" />
            </TouchableOpacity>
          </View>

          {loadingConversations ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#E6B0B0" />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="chatbubble-outline" size={42} color="#E6B0B0" />
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}>
          <View style={styles.threadHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setActiveConversation(null);
                setMessages([]);
                setMessageText("");
                setSelectedImageUri("");
              }}
              activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={20} color="#4A1C22" />
            </TouchableOpacity>

            <View style={styles.threadHeaderTextWrap}>
              <Text style={styles.threadTitle}>{activeConversation.customer_name || "Customer"}</Text>
              <Text style={styles.threadSubtitle}>{activeConversation.customer_email}</Text>
            </View>
          </View>

          {loadingMessages ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#E6B0B0" />
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
                <Ionicons name="close-circle" size={22} color="#E6B0B0" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.iconActionButton} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="image-outline" size={19} color="#4A1C22" />
            </TouchableOpacity>

            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type your message"
              placeholderTextColor="#A47E84"
              style={styles.input}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              activeOpacity={0.85}
              disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 62 : 42,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    color: "#F2E6E6",
    fontSize: 24,
    fontWeight: "800",
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,176,176,0.45)",
    backgroundColor: "#E6B0B0",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationList: {
    paddingBottom: 12,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(230,176,176,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  conversationAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E6B0B0",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationBody: {
    flex: 1,
    marginLeft: 10,
  },
  conversationName: {
    color: "#2B0F14",
    fontSize: 15,
    fontWeight: "700",
  },
  conversationPreview: {
    color: "#7A1F2B",
    fontSize: 13,
    marginTop: 2,
  },
  conversationMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  conversationTime: {
    color: "#6E3A43",
    fontSize: 11,
    fontWeight: "600",
  },
  unreadBadge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D85B5B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#F2E6E6",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: "#E6B0B0",
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230,176,176,0.35)",
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E6B0B0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  threadHeaderTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  threadTitle: {
    color: "#F2E6E6",
    fontSize: 16,
    fontWeight: "800",
  },
  threadSubtitle: {
    color: "#E6B0B0",
    fontSize: 12,
    marginTop: 2,
  },
  messageList: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageRowUnknown: {
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  messageBubbleMine: {
    backgroundColor: "#E6B0B0",
    borderColor: "rgba(255,255,255,0.6)",
  },
  messageBubbleOther: {
    backgroundColor: "rgba(74,28,34,0.95)",
    borderColor: "rgba(230,176,176,0.35)",
  },
  messageBubbleUnknown: {
    backgroundColor: "rgba(122,31,43,0.9)",
  },
  messageImage: {
    width: 190,
    height: 190,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(43,15,20,0.5)",
  },
  messageText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMine: {
    color: "#2B0F14",
  },
  messageTime: {
    color: "#F2E6E6",
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
  },
  selectedImageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  selectedImagePreview: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,176,176,0.5)",
  },
  removeImageButton: {
    marginLeft: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(230,176,176,0.45)",
    padding: 8,
    marginBottom: 30,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6B0B0",
  },
  input: {
    flex: 1,
    color: "#2B0F14",
    fontSize: 14,
    maxHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A1C22",
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
});

export default TailorChatbox;
