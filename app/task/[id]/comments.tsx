import useToast from "@/components/toast/useToast";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
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
  image?: string;
  link?: string;
  createdAt: string;
};

export default function CommentsScreen() {
  const { title } = useLocalSearchParams();
  const navigation = useNavigation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      text: "Please clarify the API response format.",
      createdAt: "2h ago",
    },
  ]);

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: `${title} · Comments`,
      headerTitleAlign: "center",
    });
  }, []);

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      toast.show("Image must be under 1 MB", "error");
      return;
    }

    setImage(asset.uri);
  };

  const addComment = () => {
    if (!text.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        image: image || undefined,
        link: link || undefined,
        createdAt: "just now",
      },
    ]);

    setText("");
    setLink("");
    setImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
        {/* SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{padding:10}}>
          {comments.map((item) => (
            <View key={item.id} style={styles.commentCard}>
              <Text style={styles.commentText}>{item.text}</Text>

              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.commentImage}
                />
              )}

              {item.link && <Text style={styles.commentLink}>{item.link}</Text>}

              <Text style={styles.time}>{item.createdAt}</Text>
            </View>
          ))}
          </View>
        </ScrollView>

        {/* INPUT BAR (NOT SCROLLABLE) */}
        <View style={[styles.inputArea, { paddingBottom: 10 + insets.bottom }]}>
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

            <Pressable style={styles.sendBtn} onPress={addComment}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1, // ⭐ KEY FIX
  },
  commentCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
