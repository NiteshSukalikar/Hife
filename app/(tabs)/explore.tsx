import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import { useHifeTheme } from "@/hooks/use-hife-theme";
import {
  AiDecisionResult,
  AiRecommendation,
  BudgetSettings,
  PurchaseTiming,
  PurchaseType,
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
import { Picker } from "@react-native-picker/picker";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
  getBudgetCategories,
  PRIORITY_EXPLANATIONS,
} from "@/utils/budget";
import { validateImageAsset } from "@/utils/productMedia";
import { parseProductLinks } from "@/utils/productLinks";
import { buildRequestBudgetImpact } from "@/utils/requestBudgetImpact";
import { getPriorityLabel } from "@/utils/requestPresentation";
import { validateRequestDraft } from "@/utils/requestValidation";
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
const PRIORITY_OPTIONS: { label: string; value: RequestPriority; helper: string }[] = [
  { label: "Need today", value: "P0", helper: "Cannot wait" },
  { label: "Soon", value: "P1", helper: "1-2 days" },
  { label: "This week", value: "P2", helper: "Can wait" },
  { label: "Someday", value: "P3", helper: "Low urgency" },
];
const TIMING_OPTIONS: { label: string; value: PurchaseTiming; helper: string }[] = [
  { label: "Today", value: "today", helper: "Need it now" },
  { label: "Few days", value: "few_days", helper: "Can compare" },
  { label: "This month", value: "this_month", helper: "Plan ahead" },
  { label: "No rush", value: "no_rush", helper: "Wait safely" },
];
const PURCHASE_TYPE_OPTIONS: {
  label: string;
  value: PurchaseType;
  helper: string;
}[] = [
  { label: "New", value: "new_purchase", helper: "First buy" },
  { label: "Replace", value: "replacement", helper: "Old one failed" },
  { label: "Upgrade", value: "upgrade", helper: "Better version" },
];
const PREVIEW_BUDGET_SETTINGS: BudgetSettings = {
  monthlyBudget: 5000,
  monthlyIncome: 12000,
  committedExpenses: 3000,
  savingsReserve: 2000,
  categoryBudgets: {
    Home: 5000,
    Kitchen: 2500,
    Work: 2000,
  },
};
const PREVIEW_REQUESTS: PurchaseRequest[] = [
  {
    id: "preview",
    title: "Quiet Air Purifier",
    productName: "Quiet Air Purifier",
    info: "Needed for better sleep and cleaner room air.",
    reason: "The room gets dusty quickly and this keeps the space healthier without making noise.",
    priority: "P1",
    expectedPrice: 3500,
    maxBudget: 5000,
    budget: 5000,
    category: "Home",
    links: [],
    status: "purchased",
  },
];

type SelectTileProps<T extends string> = {
  options: { label: string; value: T; helper?: string }[];
  value: T;
  onChange: (value: T) => void;
};

function SelectTiles<T extends string>({
  options,
  value,
  onChange,
}: SelectTileProps<T>) {
  return (
    <View style={styles.selectTiles}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            style={[styles.selectTile, selected && styles.selectTileActive]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.selectTileLabel,
                selected && styles.selectTileLabelActive,
              ]}
            >
              {option.label}
            </Text>
            {option.helper ? (
              <Text
                style={[
                  styles.selectTileHelper,
                  selected && styles.selectTileHelperActive,
                ]}
              >
                {option.helper}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

type CategoryDropdownProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  palette: ReturnType<typeof useHifeTheme>["palette"];
};

function CategoryDropdown({
  options,
  value,
  onChange,
  palette,
}: CategoryDropdownProps) {
  return (
    <View
      style={[
        styles.categoryPickerShell,
        { backgroundColor: palette.input, borderColor: palette.border },
      ]}
    >
      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => onChange(String(itemValue))}
        dropdownIconColor={palette.primary}
        style={[styles.categoryPicker, { color: palette.text }]}
      >
        {options.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>
    </View>
  );
}

export default function CreateRequestScreen() {
  const { palette } = useHifeTheme();
  const [image, setImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("P1");
  const [purchaseTiming, setPurchaseTiming] =
    useState<PurchaseTiming>("few_days");
  const [purchaseType, setPurchaseType] =
    useState<PurchaseType>("new_purchase");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [category, setCategory] = useState("Other");
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
  const isPreview =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preview");
  const screenTextColor = palette.chromeText;
  const screenMutedColor = palette.chromeMutedText;
  const inputStyle = {
    backgroundColor: palette.card,
    borderColor: palette.border,
    color: palette.text,
  };

  useFocusEffect(
    useCallback(() => {
      if (isPreview) {
        setBudgetSettings(PREVIEW_BUDGET_SETTINGS);
        return;
      }

      getBudgetSettings()
        .then((settings) => {
          setBudgetSettings(settings);
        })
        .catch((error) => {
          logError("Failed to load budget context", error);
        });
    }, [isPreview])
  );

  useEffect(() => {
    if (isPreview) {
      setRequests(PREVIEW_REQUESTS);
      return;
    }

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
  }, [isPreview]);

  const budgetSummary = useMemo(
    () => buildBudgetSummary(requests, budgetSettings),
    [budgetSettings, requests]
  );

  const expectedAmount = Number(expectedPrice || 0);
  const categorySummary = budgetSummary.categorySummaries.find(
    (item) => item.category === category
  );
  const budgetCategories = useMemo(
    () => getBudgetCategories(budgetSettings),
    [budgetSettings]
  );
  const categoryRemaining = Number(categorySummary?.remaining || 0);
  const categoryProjectedRemaining = Number(
    categorySummary?.projectedRemaining || 0
  );
  const requestImpact = buildRequestBudgetImpact({
    amount: expectedAmount,
    safeToSpend: budgetSummary.safeToSpend,
    categoryBudget: categorySummary?.budget || 0,
    categoryProjectedRemaining,
  });
  const selectedUrgency = getPriorityLabel(priority);
  const maxRequestBudget =
    budgetSummary.decisionBudget > 0
      ? Math.min(categoryProjectedRemaining, Math.max(0, budgetSummary.safeToSpend))
      : categoryRemaining;
  const exceedsSafeToSpend =
    budgetSummary.decisionBudget > 0 && requestImpact.exceedsSafeToSpend;
  const exceedsCategoryBudget = requestImpact.exceedsCategoryBudget;
  const consumesTooMuchCategory = requestImpact.consumesLargeCategoryShare;
  const shouldReviewBeforeSubmit =
    expectedAmount > 0 &&
    (exceedsSafeToSpend ||
      exceedsCategoryBudget ||
      (budgetSummary.decisionBudget > 0 &&
        expectedAmount >= budgetSummary.decisionBudget * 0.25));

  useEffect(() => {
    setAiDecision(null);
    setAiError("");
  }, [
    productName,
    reason,
    priority,
    purchaseTiming,
    purchaseType,
    expectedPrice,
    maxRequestBudget,
    category,
  ]);

  useEffect(() => {
    if (!budgetCategories.includes(category)) {
      setCategory(budgetCategories[0] || "Other");
    }
  }, [budgetCategories, category]);

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
    setPurchaseTiming("few_days");
    setPurchaseType("new_purchase");
    setExpectedPrice("");
    setCategory(budgetCategories[0] || "Other");
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
    if (maxRequestBudget <= 0) {
      Alert.alert(
        "Validation",
        "Set a budget for this category from the dashboard before asking AI"
      );
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
        budget: maxRequestBudget,
        priority,
        category,
        recentSpending: {
          monthKey: budgetSummary.currentMonthKey,
          monthlyBudget: budgetSummary.decisionBudget,
          approvedThisMonth: budgetSummary.approvedTotal,
          pendingThisMonth: budgetSummary.pendingTotal,
          monthlyRemaining: budgetSummary.safeToSpend,
          categoryBudget: categorySummary?.budget || 0,
          categoryRemaining: categorySummary?.projectedRemaining || 0,
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

  const onSave = async (confirmedHighValue = false) => {
    if (isSaving) return;

    const validation = validateRequestDraft({
      productName,
      reason,
      expectedPrice,
      maxBudget: maxRequestBudget,
      linksText,
    });

    if (!validation.isValid) {
      Alert.alert("Validation", validation.message);
      return;
    }

    if (maxRequestBudget <= 0) {
      Alert.alert(
        "Validation",
        "Set a category budget on the dashboard before creating this request"
      );
      return;
    }

    if (shouldReviewBeforeSubmit && !confirmedHighValue) {
      Alert.alert(
        "Review budget impact",
        "This request uses a meaningful part of the available budget. Check the timing and impact before sending it for approval.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Create request",
            onPress: () => onSave(true),
          },
        ]
      );
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
        purchaseTiming,
        purchaseType,
        expectedPrice: Number(expectedPrice),
        maxBudget: maxRequestBudget,
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
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              style={[
                styles.imagePicker,
                { backgroundColor: palette.card, borderColor: palette.border },
                imageError ? styles.imagePickerError : null,
              ]}
              disabled={isSaving}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imageText}>Add product image</Text>
                  <Text style={styles.imageHint}>
                    Optional, but useful for quick decisions.
                  </Text>
                </View>
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

            <View style={styles.fieldHeader}>
            <Text style={[styles.label, { color: screenTextColor }]}>Product name</Text>
              <Text style={[styles.counterText, { color: screenMutedColor }]}>
                {productName.length}/40
              </Text>
            </View>
            <TextInput
              style={[styles.input, inputStyle]}
              value={productName}
              maxLength={40}
              onChangeText={setProductName}
              placeholder="Example: Air fryer"
              placeholderTextColor={palette.mutedText}
            />

            <View style={styles.fieldHeader}>
              <Text style={[styles.label, { color: screenTextColor }]}>Reason</Text>
              <Text style={[styles.counterText, { color: screenMutedColor }]}>
                {reason.length}/500
              </Text>
            </View>
            <TextInput
              style={[styles.input, inputStyle, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why should this be purchased?"
              placeholderTextColor={palette.mutedText}
              multiline
              maxLength={500}
            />

            <View
              style={[
                styles.formSection,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.label, { color: palette.text }]}>Category</Text>
              <CategoryDropdown
                options={budgetCategories}
                value={category}
                onChange={setCategory}
                palette={palette}
              />

              <Text style={[styles.label, { color: palette.text }]}>Priority</Text>
              <SelectTiles
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={setPriority}
              />
              <Text style={[styles.promptText, { color: palette.mutedText }]}>
                Can this wait? {PRIORITY_EXPLANATIONS[priority]}
              </Text>

              <Text style={[styles.label, { color: palette.text }]}>Purchase timing</Text>
              <SelectTiles
                options={TIMING_OPTIONS}
                value={purchaseTiming}
                onChange={setPurchaseTiming}
              />

              <Text style={[styles.label, { color: palette.text }]}>Purchase type</Text>
              <SelectTiles
                options={PURCHASE_TYPE_OPTIONS}
                value={purchaseType}
                onChange={setPurchaseType}
              />
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Text style={[styles.label, { color: screenTextColor }]}>Expected price</Text>
                <TextInput
                  style={[styles.input, inputStyle]}
                  value={expectedPrice}
                  keyboardType="numeric"
                  onChangeText={(t) => setExpectedPrice(t.replace(/[^0-9]/g, ""))}
                  placeholder="INR"
                  placeholderTextColor={palette.mutedText}
                />
              </View>

              <View style={styles.priceField}>
                <Text style={[styles.label, { color: screenTextColor }]}>Max budget</Text>
                <TextInput
                  style={[styles.input, inputStyle, styles.disabledInput]}
                  value={formatInr(maxRequestBudget)}
                  editable={false}
                  placeholderTextColor={palette.mutedText}
                />
              </View>
            </View>

            <View
              style={[
                styles.budgetImpact,
                { backgroundColor: palette.card, borderColor: palette.border },
                exceedsSafeToSpend || exceedsCategoryBudget || consumesTooMuchCategory
                  ? styles.budgetImpactWarning
                  : null,
              ]}
            >
              <Text style={[styles.budgetImpactTitle, { color: palette.primary }]}>
                Budget impact
              </Text>
              <View style={styles.impactRow}>
                <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>Category budget</Text>
                <Text style={[styles.budgetImpactValue, { color: palette.text }]}>
                  {formatInr(requestImpact.categoryBudget)}
                </Text>
              </View>
              <View style={styles.impactRow}>
                <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>Category left now</Text>
                <Text style={[styles.budgetImpactValue, { color: palette.text }]}>
                  {formatInr(requestImpact.categoryProjectedRemaining)}
                </Text>
              </View>
              <View style={styles.impactRow}>
                <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>Category after request</Text>
                <Text style={[styles.budgetImpactValue, { color: palette.text }]}>
                  {requestImpact.categoryRemainingAfterRequest < 0
                    ? `over by ${formatInr(Math.abs(requestImpact.categoryRemainingAfterRequest))}`
                    : formatInr(requestImpact.categoryRemainingAfterRequest)}
                </Text>
              </View>
              <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>
                Safe to spend now: {formatInr(requestImpact.safeToSpendNow)}
              </Text>
              <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>
                After this request:{" "}
                {requestImpact.safeToSpendAfterRequest < 0
                  ? `over by ${formatInr(Math.abs(requestImpact.safeToSpendAfterRequest))}`
                  : formatInr(requestImpact.safeToSpendAfterRequest)}
              </Text>
              <Text style={[styles.budgetImpactText, { color: palette.mutedText }]}>
                Urgency: {selectedUrgency}
              </Text>
              {expectedAmount > 0 && exceedsSafeToSpend ? (
                <Text style={styles.warningText}>
                  This would push safe-to-spend below zero. Consider waiting or lowering the amount.
                </Text>
              ) : null}
              {expectedAmount > 0 && exceedsCategoryBudget ? (
                <Text style={styles.warningText}>
                  This is above the remaining {category} category room.
                </Text>
              ) : null}
              {expectedAmount > 0 &&
              !exceedsCategoryBudget &&
              consumesTooMuchCategory ? (
                <Text style={styles.warningText}>
                  This uses a large share of the {category} category. A quick review is wise.
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.aiPanel,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
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
                    { backgroundColor: palette.primary },
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
                        {getPriorityLabel(aiDecision.suggestedPriority)}
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

            <View style={styles.fieldHeader}>
              <Text style={[styles.label, { color: screenTextColor }]}>Product links</Text>
              <Text style={[styles.counterText, { color: screenMutedColor }]}>Optional</Text>
            </View>
            <TextInput
              style={[styles.input, inputStyle, styles.linksInput]}
              value={linksText}
              onChangeText={setLinksText}
              placeholder="Paste one or more links, separated by commas or lines"
              placeholderTextColor={palette.mutedText}
              multiline
              autoCapitalize="none"
              keyboardType="url"
            />

            <Pressable
              style={[
                styles.saveBtn,
                { backgroundColor: palette.primary },
                isSaving ? styles.disabledBtn : null,
              ]}
              disabled={isSaving}
              onPress={() => onSave()}
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
    backgroundColor: "#FAF6EE",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 430,
    padding: 20,
    paddingBottom: 34,
    width: "100%",
  },
  imagePicker: {
    height: 190,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#7A4B36",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
  },
  imagePickerError: {
    borderColor: "#A85C44",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imageOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(247, 242, 235, 0.88)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  imageOverlayText: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "700",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  imageText: {
    fontSize: 16,
    color: "#A85C44",
    fontWeight: "700",
  },
  imageHint: {
    color: "#776E64",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "center",
  },
  errorText: {
    color: "#873926",
    fontSize: 13,
    marginBottom: 4,
    marginTop: -8,
  },
  label: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counterText: {
    color: "#776E64",
    flexShrink: 0,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
    shadowColor: "#7A4B36",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DECE",
    borderRadius: 8,
    color: "#3A2E28",
    minHeight: 52,
    padding: 14,
    fontSize: 16,
  },
  disabledInput: {
    color: "#776E64",
    opacity: 0.82,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  selectTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryPickerShell: {
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  categoryPicker: {
    height: 52,
    width: "100%",
  },
  selectTile: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 52,
    minWidth: 112,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectTileActive: {
    backgroundColor: "#A85C44",
    borderColor: "#A85C44",
  },
  selectTileLabel: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "900",
  },
  selectTileLabelActive: {
    color: "#FAF6EE",
  },
  selectTileHelper: {
    color: "#776E64",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  selectTileHelperActive: {
    color: "#FAF6EE",
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceField: {
    flex: 1,
  },
  budgetImpact: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  budgetImpactWarning: {
    borderColor: "#C4943A",
  },
  budgetImpactTitle: {
    color: "#A85C44",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  budgetImpactText: {
    color: "#776E64",
    fontSize: 14,
    lineHeight: 21,
  },
  budgetImpactValue: {
    color: "#3A2E28",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    textAlign: "right",
  },
  impactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  promptText: {
    color: "#776E64",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 8,
  },
  warningText: {
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  aiPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
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
    color: "#A85C44",
    fontSize: 18,
    fontWeight: "800",
  },
  aiHint: {
    color: "#776E64",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  askAiButton: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  askAiText: {
    color: "#FAF6EE",
    fontSize: 13,
    fontWeight: "800",
  },
  aiResult: {
    borderTopColor: "#E8DECE",
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
    color: "#776E64",
    fontSize: 12,
    fontWeight: "700",
  },
  aiResultValue: {
    color: "#3A2E28",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  aiPriorityPill: {
    backgroundColor: "#A85C44",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  aiPriorityText: {
    color: "#FAF6EE",
    fontSize: 13,
    fontWeight: "900",
  },
  applyPriorityButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  applyPriorityText: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "800",
  },
  aiSectionLabel: {
    color: "#6F7F6A",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    textTransform: "uppercase",
  },
  aiBody: {
    color: "#3A2E28",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  aiMessage: {
    backgroundColor: "#F5F0E8",
    borderRadius: 8,
    color: "#3A2E28",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    padding: 10,
  },
  aiCacheText: {
    color: "#776E64",
    fontSize: 12,
    marginTop: 10,
  },
  linksInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  saveBtn: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 52,
    paddingVertical: 14,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  saveText: {
    color: "#FAF6EE",
    fontSize: 16,
    fontWeight: "600",
  },
});
