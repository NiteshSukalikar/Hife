import useToast from "@/components/toast/useToast";
import { addComment, getComments } from "@/services/comments";
import { uploadImage } from "@/services/uploadImage";
import { getDeviceUserId } from "@/utils/deviceUser";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

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

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      show("Image must be under 1 MB", "error");
      return;
    }

    setImage(asset.uri);
  };

  const handleAddComment = async () => {
    if (!text.trim()) {
      show("Comment cannot be empty", "error");
      return;
    }

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await addComment(taskId as string, {
        text: text.trim(),
        image: imageUrl,
        link: link || null,
      });

      show("Comment added", "success");

      setText("");
      setLink("");
      setImage(null);

      loadComments();
    } catch (e) {
      console.error(e);
      show("Failed to add comment", "error");
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
                    <Text style={styles.commentLink}>{item.link}</Text>
                  )}

                  <Text style={styles.time}>
                    {isMe ? "You" : "Partner"} - {item.createdAt}
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
          <TextInput
            placeholder="Write a comment..."
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
          />

          <View style={styles.actions}>
            <Pressable onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color="#2563eb" />
            </Pressable>

            <TextInput
              placeholder="Add link (optional)"
              style={styles.linkInput}
              value={link}
              onChangeText={setLink}
            />

            <Pressable style={styles.sendBtn} onPress={handleAddComment}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
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
    backgroundColor: "#dcfce7",
    alignSelf: "flex-end",
  },
  otherComment: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
  },
  commentText: {
    fontSize: 15,
    marginBottom: 6,
  },
  commentImage: {
    height: 140,
    borderRadius: 8,
    marginVertical: 6,
  },
  commentLink: {
    color: "#2563eb",
    fontSize: 13,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#64748b",
    alignSelf: "flex-end",
  },
  inputArea: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    backgroundColor: "#fff",
  },
  input: {
    minHeight: 40,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 6,
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 50,
  },
});
