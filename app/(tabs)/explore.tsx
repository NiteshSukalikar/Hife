import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import {
  AiDecisionResult,
  AiRecommendation,
  BudgetSettings,
  PurchaseRequest,
  RequestPriority,
} from "@/constants/types";
import {
  getAiDecisionForDraft,
  MONTHLY_AI_USAGE_LIMIT,
} from "@/services/aiDecisionAssistant";
import { getBudgetSettings } from "@/services/budgets";
import {
  createPurchaseRequest,
  subscribeToPurchaseRequests,
} from "@/services/purchaseRequests";
import { uploadImage } from "@/services/uploadImage";
import { logError } from "@/utils/safeLogger";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
  PRIORITY_EXPLANATIONS,
  REQUEST_CATEGORIES,
} from "@/utils/budget";
import { validateImageAsset } from "@/utils/productMedia";
import { parseProductLinks } from "@/utils/productLinks";
import { validateRequestDraft } from "@/utils/requestValidation";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const AI_RECOMMENDATION_LABELS: Record<AiRecommendation, string> = {
  approve: "Approve",
  decline: "Decline",
  buy_later: "Buy later",
  needs_more_info: "Needs more info",
};

export default function CreateRequestScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("P1");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [category, setCategory] = useState("Household");
  const [linksText, setLinksText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [aiDecision, setAiDecision] = useState<AiDecisionResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);

  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      getBudgetSettings()
        .then((settings) => {
          setBudgetSettings(settings);
        })
        .catch((error) => {
          logError("Failed to load budget context", error);
        });
    }, [])
  );

  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    let cancelled = false;

    subscribeToPurchaseRequests(
      (data: PurchaseRequest[]) => setRequests(data),
      (error: unknown) => {
        logError("Failed to listen for budget context", error);
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
  }, []);

  const budgetSummary = useMemo(
    () => buildBudgetSummary(requests, budgetSettings),
    [budgetSettings, requests]
  );

  const expectedAmount = Number(expectedPrice || 0);
  const categorySummary = budgetSummary.categorySummaries.find(
    (item) => item.category === category
  );
  const exceedsMonthlyBudget =
    budgetSummary.monthlyBudget > 0 &&
    expectedAmount > budgetSummary.remainingBudget;
  const exceedsCategoryBudget =
    !!categorySummary?.budget && expectedAmount > categorySummary.remaining;

  useEffect(() => {
    setAiDecision(null);
    setAiError("");
  }, [productName, reason, priority, expectedPrice, maxBudget, category]);

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
    setAiDecision(null);
    setAiError("");
  };

  const validateDraftForAi = () => {
    if (!productName.trim()) {
      Alert.alert("Validation", "Product name is required before asking AI");
      return false;
    }
    if (!reason.trim()) {
      Alert.alert("Validation", "Reason is required before asking AI");
      return false;
    }
    if (!expectedPrice) {
      Alert.alert("Validation", "Expected price is required before asking AI");
      return false;
    }
    if (!maxBudget) {
      Alert.alert("Validation", "Maximum budget is required before asking AI");
      return false;
    }

    return true;
  };

  const onAskAi = async () => {
    if (isAskingAi || !validateDraftForAi()) return;

    try {
      setIsAskingAi(true);
      setAiError("");
      const result = await getAiDecisionForDraft({
        title: productName,
        reason,
        price: Number(expectedPrice),
        budget: Number(maxBudget),
        priority,
        category,
        recentSpending: {
          monthKey: budgetSummary.currentMonthKey,
          monthlyBudget: budgetSummary.monthlyBudget,
          approvedThisMonth: budgetSummary.approvedTotal,
          pendingThisMonth: budgetSummary.pendingTotal,
          monthlyRemaining: budgetSummary.remainingBudget,
          categoryBudget: categorySummary?.budget || 0,
          categoryRemaining: categorySummary?.remaining || 0,
        },
      });

      setAiDecision(result);
      toast.show(
        result.fromCache
          ? "Loaded saved AI recommendation"
          : "AI recommendation ready",
        "success"
      );
    } catch (error: any) {
      logError("AI recommendation failed", error);
      const message =
        error?.code === "ai/monthly-limit-reached"
          ? error.message
          : "AI recommendation failed. You can still create the request.";
      setAiError(message);
      toast.show("AI recommendation failed", "error");
    } finally {
      setIsAskingAi(false);
    }
  };

  const onSave = async () => {
    if (isSaving) return;

    const validation = validateRequestDraft({
      productName,
      reason,
      expectedPrice,
      maxBudget,
      linksText,
    });

    if (!validation.isValid) {
      Alert.alert("Validation", validation.message);
      return;
    }

    const { links } = parseProductLinks(linksText);

    try {
      setIsSaving(true);
      setImageError("");
      let imageUrl = null;

      if (image) {
        try {
          setUploadingImage(true);
          imageUrl = await uploadImage(image);
        } catch (error) {
          logError("Image upload failed", error);
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
      logError("Failed to create request", error);
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
                {REQUEST_CATEGORIES.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={priority}
                onValueChange={(value) => setPriority(value)}
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

            <View
              style={[
                styles.budgetImpact,
                exceedsMonthlyBudget || exceedsCategoryBudget
                  ? styles.budgetImpactWarning
                  : null,
              ]}
            >
              <Text style={styles.budgetImpactTitle}>Budget impact</Text>
              <Text style={styles.budgetImpactText}>
                Monthly remaining: {formatInr(budgetSummary.remainingBudget)}
              </Text>
              <Text style={styles.budgetImpactText}>
                {category} remaining:{" "}
                {formatInr(categorySummary?.remaining || 0)}
              </Text>
              <Text style={styles.budgetImpactText}>
                Priority: {priority} - {PRIORITY_EXPLANATIONS[priority]}
              </Text>
              {expectedAmount > 0 && exceedsMonthlyBudget ? (
                <Text style={styles.warningText}>
                  This request exceeds the available monthly budget.
                </Text>
              ) : null}
              {expectedAmount > 0 && exceedsCategoryBudget ? (
                <Text style={styles.warningText}>
                  This request exceeds the remaining {category} category budget.
                </Text>
              ) : null}
            </View>

            <View style={styles.aiPanel}>
              <View style={styles.aiHeader}>
                <View style={styles.aiHeaderText}>
                  <Text style={styles.aiTitle}>AI decision assistant</Text>
                  <Text style={styles.aiHint}>
                    Optional. Cached per draft, limited to {MONTHLY_AI_USAGE_LIMIT} new recommendations each month.
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.askAiButton,
                    isAskingAi ? styles.disabledBtn : null,
                  ]}
                  disabled={isAskingAi}
                  onPress={onAskAi}
                >
                  <Text style={styles.askAiText}>
                    {isAskingAi ? "Asking..." : "Ask AI"}
                  </Text>
                </Pressable>
              </View>

              {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}

              {aiDecision ? (
                <View style={styles.aiResult}>
                  <View style={styles.aiResultTop}>
                    <View>
                      <Text style={styles.aiResultLabel}>Recommendation</Text>
                      <Text style={styles.aiResultValue}>
                        {AI_RECOMMENDATION_LABELS[aiDecision.recommendation]}
                      </Text>
                    </View>
                    <View style={styles.aiPriorityPill}>
                      <Text style={styles.aiPriorityText}>
                        {aiDecision.suggestedPriority}
                      </Text>
                    </View>
                  </View>

                  {aiDecision.suggestedPriority !== priority ? (
                    <Pressable
                      style={styles.applyPriorityButton}
                      onPress={() => setPriority(aiDecision.suggestedPriority)}
                    >
                      <Text style={styles.applyPriorityText}>
                        Use suggested priority
                      </Text>
                    </Pressable>
                  ) : null}

                  <Text style={styles.aiSectionLabel}>Budget impact</Text>
                  <Text style={styles.aiBody}>{aiDecision.budgetImpact}</Text>

                  <Text style={styles.aiSectionLabel}>Reasoning</Text>
                  <Text style={styles.aiBody}>{aiDecision.reasoning}</Text>

                  <Text style={styles.aiSectionLabel}>Suggested message</Text>
                  <Text style={styles.aiMessage}>
                    {aiDecision.suggestedMessage}
                  </Text>

                  {aiDecision.fromCache ? (
                    <Text style={styles.aiCacheText}>
                      Showing a saved result for this draft.
                    </Text>
                  ) : null}
                </View>
              ) : null}
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
  budgetImpact: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  budgetImpactWarning: {
    borderColor: "#f59e0b",
  },
  budgetImpactTitle: {
    color: "#39FF14",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  budgetImpactText: {
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 19,
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  aiPanel: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  aiHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    color: "#39FF14",
    fontSize: 14,
    fontWeight: "800",
  },
  aiHint: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  askAiButton: {
    backgroundColor: "#39FF14",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  askAiText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "800",
  },
  aiResult: {
    borderTopColor: "#263026",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  aiResultTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  aiResultLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "700",
  },
  aiResultValue: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  aiPriorityPill: {
    backgroundColor: "#39FF14",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  aiPriorityText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "900",
  },
  applyPriorityButton: {
    alignSelf: "flex-start",
    borderColor: "#39FF14",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  applyPriorityText: {
    color: "#39FF14",
    fontSize: 12,
    fontWeight: "800",
  },
  aiSectionLabel: {
    color: "#B8FFB0",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    textTransform: "uppercase",
  },
  aiBody: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  aiMessage: {
    backgroundColor: "#171A18",
    borderRadius: 8,
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    padding: 10,
  },
  aiCacheText: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 10,
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
