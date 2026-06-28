import useToast from "@/components/toast/useToast";
import { addComment, getComments } from "@/services/comments";
import { uploadImage } from "@/services/uploadImage";
import { getDeviceUserId } from "@/utils/deviceUser";
import { validateImageAsset } from "@/utils/productMedia";
import { validateProductUrl } from "@/utils/productLinks";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Comment = {
  id: string;
  text: string;
  image?: string | null;
  link?: string | null;
  authorId: string;
  authorDisplayName?: string;
  authorRoleLabel?: string;
  createdAt: string;
};

export default function CommentsScreen() {
  const { id: taskId, title } = useLocalSearchParams();
  const navigation = useNavigation();
  const { show } = useToast();
  const insets = useSafeAreaInsets();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComments(taskId as string);
      setComments(data);
    } catch (e) {
      console.error(e);
      show("Failed to load discussion", "error");
    } finally {
      setLoading(false);
    }
  }, [show, taskId]);

  useEffect(() => {
    navigation.setOptions({
      title: `${title} - Discussion`,
      headerTitleAlign: "center",
    });

    getDeviceUserId().then(setMyUserId);
    loadComments();
  }, [loadComments, navigation, title]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const validationError = validateImageAsset(asset);

    if (validationError) {
      setImageError(validationError);
      show(validationError, "error");
      return;
    }

    setImageError("");
    setImage(asset.uri);
  };

  const openLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      show("Could not open this link", "error");
      return;
    }

    Linking.openURL(url);
  };

  const handleAddComment = async () => {
    if (isSending) return;

    if (!text.trim()) {
      show("Comment cannot be empty", "error");
      return;
    }

    const normalizedLink = link.trim() ? validateProductUrl(link) : null;

    if (link.trim() && !normalizedLink) {
      show("Enter a valid product link", "error");
      return;
    }

    try {
      setIsSending(true);
      setImageError("");
      let imageUrl = null;

      if (image) {
        try {
          setUploadingImage(true);
          imageUrl = await uploadImage(image);
        } catch (e) {
          console.error(e);
          setImageError(
            "Image upload failed. Check your connection and try again."
          );
          show("Image upload failed", "error");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      await addComment(taskId as string, {
        text: text.trim(),
        image: imageUrl,
        link: normalizedLink,
      });

      show("Comment added", "success");

      setText("");
      setLink("");
      setImage(null);
      setImageError("");

      loadComments();
    } catch (e) {
      console.error(e);
      show("Failed to add comment", "error");
    } finally {
      setUploadingImage(false);
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.commentsContent}>
            {!loading && comments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No discussion yet</Text>
                <Text style={styles.emptyText}>
                  Add a note, product link, or question to start the decision.
                </Text>
              </View>
            )}

            {comments.map((item) => {
              const isMe = item.authorId === myUserId;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.commentCard,
                    isMe ? styles.myComment : styles.otherComment,
                  ]}
                >
                  <Text style={styles.commentText}>{item.text}</Text>

                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.commentImage}
                      resizeMode="cover"
                    />
                  )}

                  {item.link && (
                    <Pressable onPress={() => openLink(item.link || "")}>
                      <Text style={styles.commentLink}>{item.link}</Text>
                    </Pressable>
                  )}

                  <Text style={styles.time}>
                    {isMe
                      ? `You${item.authorRoleLabel ? ` (${item.authorRoleLabel})` : ""}`
                      : item.authorDisplayName || item.authorRoleLabel || "Partner"}{" "}
                    - {item.createdAt}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={[
            styles.inputArea,
            { paddingBottom: 10 + insets.bottom },
          ]}
        >
          {image ? (
            <View
              style={[
                styles.selectedImageRow,
                imageError ? styles.selectedImageRowError : null,
              ]}
            >
              <Text style={styles.selectedImageText}>
                {uploadingImage ? "Uploading image..." : "Image attached"}
              </Text>
              <Pressable disabled={isSending} onPress={() => setImage(null)}>
                <Text style={styles.removeImageText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          {imageError ? (
            <Text style={styles.errorText}>{imageError}</Text>
          ) : null}

          <TextInput
            placeholder="Write a comment..."
            placeholderTextColor="#71717A"
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
          />

          <View style={styles.actions}>
            <Pressable disabled={isSending} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color="#39FF14" />
            </Pressable>

            <TextInput
              placeholder="Add link (optional)"
              placeholderTextColor="#71717A"
              style={styles.linkInput}
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Pressable
              style={[styles.sendBtn, isSending ? styles.disabledBtn : null]}
              disabled={isSending}
              onPress={handleAddComment}
            >
              <Ionicons name="send" size={20} color="#050505" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  commentsContent: {
    padding: 12,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  commentCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    maxWidth: "85%",
  },
  myComment: {
    backgroundColor: "#173314",
    alignSelf: "flex-end",
  },
  otherComment: {
    backgroundColor: "#101312",
    alignSelf: "flex-start",
  },
  commentText: {
    color: "#F8FAFC",
    fontSize: 15,
    marginBottom: 6,
  },
  commentImage: {
    height: 140,
    borderRadius: 8,
    marginVertical: 6,
  },
  commentLink: {
    color: "#39FF14",
    fontSize: 13,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#A1A1AA",
    alignSelf: "flex-end",
  },
  inputArea: {
    borderTopWidth: 1,
    borderColor: "#263026",
    padding: 10,
    backgroundColor: "#050505",
  },
  selectedImageRow: {
    alignItems: "center",
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 8,
  },
  selectedImageRowError: {
    borderColor: "#dc2626",
  },
  selectedImageText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
  },
  removeImageText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#101312",
    minHeight: 40,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    color: "#F8FAFC",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkInput: {
    flex: 1,
    backgroundColor: "#101312",
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 8,
    padding: 6,
    fontSize: 13,
    color: "#F8FAFC",
  },
  sendBtn: {
    backgroundColor: "#39FF14",
    padding: 10,
    borderRadius: 50,
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
