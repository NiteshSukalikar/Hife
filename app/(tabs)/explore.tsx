import { createPurchaseRequest } from "@/app/api/tickets";
import { uploadImage } from "@/app/api/uploadImage";
import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateRequestScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");
  const [priority, setPriority] = useState("P1");
  const [budget, setBudget] = useState("");

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
  const toast = useToast();

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

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }
    if (title.length > 20) {
      Alert.alert("Validation", "Max 20 characters");
      return;
    }
    if (info.length > 500) {
      Alert.alert("Validation", "Max 500 characters");
      return;
    }
    if (!budget) {
      Alert.alert("Validation", "Budget is required");
      return;
    }

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await createPurchaseRequest({
        title: title.trim(),
        info: info.trim(),
        priority,
        budget,
        image: imageUrl,
      });

      toast.show("Request created successfully", "success");

      setTitle("");
      setInfo("");
      setPriority("P1");
      setBudget("");
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.show("Failed to create request", "error");
    }
  };

  return (
    <>
      <Header />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <Text style={styles.imageText}>Add product image</Text>
              )}
            </Pressable>

            <Text style={styles.label}>Title (max 20 chars)</Text>
            <TextInput
              style={styles.input}
              value={title}
              maxLength={20}
              onChangeText={setTitle}
              placeholder="Enter title"
            />

            <Text style={styles.label}>Info (max 500 chars)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={info}
              onChangeText={setInfo}
              placeholder="Enter details"
              multiline
              maxLength={500}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={priority} onValueChange={setPriority}>
                <Picker.Item label="P0 - Immediate (12 hrs)" value="P0" />
                <Picker.Item label="P1 - Within 24 hrs" value="P1" />
                <Picker.Item label="P2 - Within 48 hrs" value="P2" />
                <Picker.Item label="P3 - Within 72 hrs" value="P3" />
              </Picker>
            </View>

            <Text style={styles.label}>Budget (INR)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              keyboardType="numeric"
              onChangeText={(t) => setBudget(t.replace(/[^0-9]/g, ""))}
              placeholder="Enter budget"
            />

            <View style={styles.spacer} />

            <Pressable style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveText}>Create Request</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 16,
  },
  imagePicker: {
    height: 160,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imageText: {
    fontSize: 16,
    color: "#374151",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  spacer: {
    flexGrow: 1,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
