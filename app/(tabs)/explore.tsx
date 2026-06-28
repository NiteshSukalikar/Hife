import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import { createPurchaseRequest } from "@/services/purchaseRequests";
import { uploadImage } from "@/services/uploadImage";
import { validateImageAsset } from "@/utils/productMedia";
import { parseProductLinks } from "@/utils/productLinks";
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

export default function CreateRequestScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("P1");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [category, setCategory] = useState("Household");
  const [linksText, setLinksText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const toast = useToast();

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
      toast.show(validationError, "error");
      return;
    }

    setImageError("");
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
    setImageError("");
  };

  const onSave = async () => {
    if (isSaving) return;

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

    const { links, invalidLinks } = parseProductLinks(linksText);

    if (invalidLinks.length > 0) {
      Alert.alert(
        "Validation",
        `Check product link: ${invalidLinks[0]}`
      );
      return;
    }

    try {
      setIsSaving(true);
      setImageError("");
      let imageUrl = null;

      if (image) {
        try {
          setUploadingImage(true);
          imageUrl = await uploadImage(image);
        } catch (error) {
          console.error(error);
          setImageError(
            "Image upload failed. Check your connection and try again."
          );
          toast.show("Image upload failed", "error");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      await createPurchaseRequest({
        productName,
        reason,
        priority,
        expectedPrice: Number(expectedPrice),
        maxBudget: Number(maxBudget),
        category,
        links,
        image: imageUrl,
      });

      toast.show("Request created successfully", "success");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.show("Failed to create request", "error");
    } finally {
      setUploadingImage(false);
      setIsSaving(false);
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
            <Pressable
              style={[
                styles.imagePicker,
                imageError ? styles.imagePickerError : null,
              ]}
              disabled={isSaving}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <Text style={styles.imageText}>Add product image</Text>
              )}
              {uploadingImage ? (
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Uploading image...</Text>
                </View>
              ) : null}
            </Pressable>
            {imageError ? (
              <Text style={styles.errorText}>{imageError}</Text>
            ) : null}

            <Text style={styles.label}>Product name (max 40 chars)</Text>
            <TextInput
              style={styles.input}
              value={productName}
              maxLength={40}
              onChangeText={setProductName}
              placeholder="Example: Air fryer"
              placeholderTextColor="#71717A"
            />

            <Text style={styles.label}>Reason (max 500 chars)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why should this be purchased?"
              placeholderTextColor="#71717A"
              multiline
              maxLength={500}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                {CATEGORIES.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={priority}
                onValueChange={setPriority}
                style={styles.picker}
              >
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
                  placeholderTextColor="#71717A"
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
                  placeholderTextColor="#71717A"
                />
              </View>
            </View>

            <Text style={styles.label}>Product links</Text>
            <TextInput
              style={[styles.input, styles.linksInput]}
              value={linksText}
              onChangeText={setLinksText}
              placeholder="Paste one or more links, separated by commas or lines"
              placeholderTextColor="#71717A"
              multiline
              autoCapitalize="none"
              keyboardType="url"
            />

            <Pressable
              style={[styles.saveBtn, isSaving ? styles.disabledBtn : null]}
              disabled={isSaving}
              onPress={onSave}
            >
              <Text style={styles.saveText}>
                {uploadingImage
                  ? "Uploading Image..."
                  : isSaving
                    ? "Creating..."
                    : "Create Request"}
              </Text>
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
    backgroundColor: "#050505",
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
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imagePickerError: {
    borderColor: "#dc2626",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imageOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(5, 5, 5, 0.72)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  imageOverlayText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  imageText: {
    fontSize: 16,
    color: "#39FF14",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginBottom: 4,
    marginTop: -8,
  },
  label: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#101312",
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 8,
    color: "#F8FAFC",
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  pickerWrapper: {
    backgroundColor: "#101312",
    borderWidth: 1,
    borderColor: "#263026",
    borderRadius: 8,
  },
  picker: {
    color: "#F8FAFC",
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
    backgroundColor: "#39FF14",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.65,
  },
  saveText: {
    color: "#050505",
    fontSize: 16,
    fontWeight: "600",
  },
});
