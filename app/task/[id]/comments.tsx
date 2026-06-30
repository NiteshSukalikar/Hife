import useToast from "@/components/toast/useToast";
import { addComment, subscribeToComments } from "@/services/comments";
import {
  getNotificationSettings,
  markCommentsRead,
  scheduleLocalNotification,
} from "@/services/notifications";
import { uploadImage } from "@/services/uploadImage";
import { getDeviceUserId } from "@/utils/deviceUser";
import { validateImageAsset } from "@/utils/productMedia";
import { validateProductUrl } from "@/utils/productLinks";
import { logError } from "@/utils/safeLogger";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
const PREVIEW_COMMENTS: Comment[] = [
  {
    id: "c1",
    text: "This is useful if it is quiet enough for night. Can we keep it under the monthly budget?",
    authorId: "partner-b",
    authorDisplayName: "Subi",
    authorRoleLabel: "Partner B",
    createdAt: "29/6/2026, 7:48:32 pm",
  },
  {
    id: "c2",
    text: "Yes. INR 3,500, with INR 1,500 left after approval.",
    authorId: "partner-a",
    authorDisplayName: "Nitesh",
    authorRoleLabel: "Partner A",
    createdAt: "29/6/2026, 7:49:18 pm",
  },
  {
    id: "c3",
    text: "Approved. Please buy the quieter model.",
    authorId: "partner-b",
    authorDisplayName: "Subi",
    authorRoleLabel: "Partner B",
    createdAt: "29/6/2026, 7:50:12 pm",
  },
];

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
  const initialSnapshotSeen = useRef(false);
  const myUserIdRef = useRef<string | null>(null);
  const isPreview =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preview");

  useEffect(() => {
    navigation.setOptions({
      title: `${title} - Discussion`,
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: "#0F0F10" },
      headerTintColor: "#F7F2EB",
      headerTitleStyle: {
        color: "#F7F2EB",
        fontFamily: "serif",
        fontWeight: "800",
      },
    });

    if (isPreview) {
      setMyUserId("partner-a");
      myUserIdRef.current = "partner-a";
      return;
    }

    getDeviceUserId().then((userId) => {
      setMyUserId(userId);
      myUserIdRef.current = userId;
    });
  }, [isPreview, navigation, title]);

  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    if (isPreview) {
      setComments(PREVIEW_COMMENTS);
      setLoading(false);
      return;
    }

    let unsubscribe: undefined | (() => void);
    let cancelled = false;

    setLoading(true);

    subscribeToComments(
      taskId as string,
      async (data: Comment[], snapshot: any) => {
        setComments(data);
        setLoading(false);
        await markCommentsRead(taskId as string, data.length);

        if (!initialSnapshotSeen.current) {
          initialSnapshotSeen.current = true;
          return;
        }

        const settings = await getNotificationSettings();

        if (!settings.enabled || !settings.comments) return;

        snapshot.docChanges().forEach((change: any) => {
          const item = data.find(
            (comment: Comment) => comment.id === change.doc.id
          );
          const currentUserId = myUserIdRef.current;

          if (
            change.type === "added" &&
            item &&
            currentUserId &&
            item.authorId !== currentUserId
          ) {
            scheduleLocalNotification({
              title: "New comment",
              body: item.text,
              data: { requestId: taskId },
            });
          }
        });
      },
      (e: unknown) => {
        logError("Failed to listen for discussion", e);
        show("Failed to listen for discussion", "error");
        setLoading(false);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        unsubscribe = stop;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isPreview, show, taskId]);

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
          logError("Comment image upload failed", e);
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

    } catch (e) {
      logError("Failed to add comment", e);
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
                  <View style={styles.commentMetaRow}>
                    <Text style={styles.authorText} numberOfLines={1}>
                      {isMe
                        ? "You"
                        : item.authorDisplayName ||
                          item.authorRoleLabel ||
                          "Partner"}
                    </Text>
                    {item.authorRoleLabel ? (
                      <Text style={styles.rolePill}>{item.authorRoleLabel}</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.commentText,
                      isMe ? styles.myCommentText : null,
                    ]}
                  >
                    {item.text}
                  </Text>

                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.commentImage}
                      resizeMode="cover"
                    />
                  )}

                  {item.link && (
                    <Pressable
                      style={styles.commentLinkButton}
                      onPress={() => openLink(item.link || "")}
                    >
                      <Text style={styles.commentLink}>{item.link}</Text>
                    </Pressable>
                  )}

                  <Text style={[styles.time, isMe ? styles.myTime : null]}>
                    {item.createdAt}
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
              <Pressable
                style={styles.removeImageButton}
                disabled={isSending}
                onPress={() => setImage(null)}
              >
                <Text style={styles.removeImageText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          {imageError ? (
            <Text style={styles.errorText}>{imageError}</Text>
          ) : null}

          <TextInput
            placeholder="Write a comment..."
            placeholderTextColor="#8F867A"
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <Text style={styles.counterText}>{text.length}/500</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.iconButton}
              disabled={isSending}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={22} color="#C8A15A" />
            </Pressable>

            <TextInput
              placeholder="Add link (optional)"
              placeholderTextColor="#8F867A"
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
              <Ionicons name="send" size={20} color="#FFF9F0" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F10" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  commentsContent: {
    padding: 20,
    paddingBottom: 28,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#F7F2EB",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "rgba(237, 228, 214, 0.70)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  commentCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: "78%",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  myComment: {
    backgroundColor: "#211913",
    borderColor: "rgba(182, 106, 60, 0.68)",
    alignSelf: "flex-end",
    marginRight: 42,
    maxWidth: 174,
  },
  otherComment: {
    backgroundColor: "#FFFBF5",
    borderColor: "#DDCDBB",
    alignSelf: "flex-start",
    maxWidth: "76%",
    marginRight: 76,
  },
  commentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  authorText: {
    color: "#B66A3C",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
  },
  rolePill: {
    backgroundColor: "rgba(200, 161, 90, 0.12)",
    borderColor: "#C8A15A",
    borderRadius: 999,
    borderWidth: 1,
    color: "#C8A15A",
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentText: {
    color: "#1C1510",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  myCommentText: {
    color: "#F7F2EB",
  },
  commentImage: {
    height: 140,
    borderRadius: 12,
    marginVertical: 6,
  },
  commentLinkButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  commentLink: {
    color: "#B66A3C",
    fontSize: 13,
    marginBottom: 4,
  },
  time: {
    fontSize: 10,
    color: "#776E64",
    alignSelf: "flex-end",
  },
  myTime: {
    color: "rgba(237, 228, 214, 0.62)",
  },
  inputArea: {
    borderTopWidth: 1,
    borderColor: "rgba(200, 161, 90, 0.24)",
    paddingLeft: 14,
    paddingRight: 30,
    paddingVertical: 14,
    backgroundColor: "#171310",
  },
  selectedImageRow: {
    alignItems: "center",
    backgroundColor: "#211913",
    borderColor: "rgba(237, 228, 214, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 44,
    padding: 8,
  },
  selectedImageRowError: {
    borderColor: "#B66A3C",
  },
  selectedImageText: {
    color: "#F7F2EB",
    fontSize: 13,
    fontWeight: "700",
  },
  removeImageText: {
    color: "#873926",
    fontSize: 13,
    fontWeight: "700",
  },
  removeImageButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  errorText: {
    color: "#873926",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#211913",
    minHeight: 44,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "rgba(237, 228, 214, 0.20)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    color: "#F7F2EB",
  },
  counterText: {
    color: "rgba(237, 228, 214, 0.66)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },
  actions: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 402,
    paddingRight: 8,
    width: "100%",
  },
  linkInput: {
    flex: 1,
    backgroundColor: "#211913",
    borderWidth: 1,
    borderColor: "rgba(237, 228, 214, 0.20)",
    borderRadius: 12,
    minHeight: 44,
    padding: 6,
    fontSize: 13,
    color: "#F7F2EB",
  },
  sendBtn: {
    alignItems: "center",
    backgroundColor: "#B66A3C",
    borderRadius: 50,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 34,
    padding: 6,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
