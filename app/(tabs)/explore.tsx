import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import { ProductLink } from "@/constants/types";
import { createPurchaseRequest } from "@/services/purchaseRequests";
import { uploadImage } from "@/services/uploadImage";
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

const CATEGORIES = [
  "Household",
  "Kitchen",
  "Electronics",
  "Personal",
  "Health",
  "Other",
];

function getLinkSource(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("amazon.")) return "Amazon";
  if (normalized.includes("flipkart.")) return "Flipkart";
  if (normalized.includes("meesho.")) return "Meesho";
  if (normalized.includes("myntra.")) return "Myntra";

  return "Other";
}

function parseLinks(value: string): ProductLink[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url) => ({
      url,
      source: getLinkSource(url),
    }));
}

export default function CreateRequestScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("P1");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [category, setCategory] = useState("Household");
  const [linksText, setLinksText] = useState("");

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

  const resetForm = () => {
    setProductName("");
    setReason("");
    setPriority("P1");
    setExpectedPrice("");
    setMaxBudget("");
    setCategory("Household");
    setLinksText("");
    setImage(null);
  };

  const onSave = async () => {
    if (!productName.trim()) {
      Alert.alert("Validation", "Product name is required");
      return;
    }
    if (productName.length > 40) {
      Alert.alert("Validation", "Product name can be max 40 characters");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Validation", "Reason is required");
      return;
    }
    if (reason.length > 500) {
      Alert.alert("Validation", "Reason can be max 500 characters");
      return;
    }
    if (!expectedPrice) {
      Alert.alert("Validation", "Expected price is required");
      return;
    }
    if (!maxBudget) {
      Alert.alert("Validation", "Maximum budget is required");
      return;
    }

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await createPurchaseRequest({
        productName,
        reason,
        priority,
        expectedPrice: Number(expectedPrice),
        maxBudget: Number(maxBudget),
        category,
        links: parseLinks(linksText),
        image: imageUrl,
      });

      toast.show("Request created successfully", "success");
      resetForm();
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

            <Text style={styles.label}>Product name (max 40 chars)</Text>
            <TextInput
              style={styles.input}
              value={productName}
              maxLength={40}
              onChangeText={setProductName}
              placeholder="Example: Air fryer"
            />

            <Text style={styles.label}>Reason (max 500 chars)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why should this be purchased?"
              multiline
              maxLength={500}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={category} onValueChange={setCategory}>
                {CATEGORIES.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={priority} onValueChange={setPriority}>
                <Picker.Item label="P0 - Immediate (12 hrs)" value="P0" />
                <Picker.Item label="P1 - Within 24 hrs" value="P1" />
                <Picker.Item label="P2 - Within 48 hrs" value="P2" />
                <Picker.Item label="P3 - Within 72 hrs" value="P3" />
              </Picker>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Text style={styles.label}>Expected price</Text>
                <TextInput
                  style={styles.input}
                  value={expectedPrice}
                  keyboardType="numeric"
                  onChangeText={(t) => setExpectedPrice(t.replace(/[^0-9]/g, ""))}
                  placeholder="INR"
                />
              </View>

              <View style={styles.priceField}>
                <Text style={styles.label}>Max budget</Text>
                <TextInput
                  style={styles.input}
                  value={maxBudget}
                  keyboardType="numeric"
                  onChangeText={(t) => setMaxBudget(t.replace(/[^0-9]/g, ""))}
                  placeholder="INR"
                />
              </View>
            </View>

            <Text style={styles.label}>Product links</Text>
            <TextInput
              style={[styles.input, styles.linksInput]}
              value={linksText}
              onChangeText={setLinksText}
              placeholder="Paste Amazon, Flipkart, or other links"
              multiline
              autoCapitalize="none"
              keyboardType="url"
            />

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
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceField: {
    flex: 1,
  },
  linksInput: {
    minHeight: 72,
    textAlignVertical: "top",
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
