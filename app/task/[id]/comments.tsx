import useToast from "@/components/toast/useToast";
import { useHifeTheme } from "@/hooks/use-hife-theme";
import {
  BudgetSettings,
  ProductLink,
  PurchaseRequest,
} from "@/constants/types";
import { getBudgetSettings } from "@/services/budgets";
import { addComment, subscribeToComments } from "@/services/comments";
import {
  markCommentsRead,
} from "@/services/notifications";
import {
  subscribeToPurchaseRequest,
  subscribeToPurchaseRequests,
} from "@/services/purchaseRequests";
import { uploadImage } from "@/services/uploadImage";
import {
  buildBudgetSummary,
  DEFAULT_BUDGET_SETTINGS,
  formatInr,
  getRequestAmount,
} from "@/utils/budget";
import {
  buildDiscussionRequestSummary,
  DISCUSSION_QUICK_REPLIES,
  getCommentLinkPreview,
} from "@/utils/discussionPresentation";
import { getDeviceUserId } from "@/utils/deviceUser";
import { validateImageAsset } from "@/utils/productMedia";
import { validateProductUrl } from "@/utils/productLinks";
import { buildRequestBudgetImpact } from "@/utils/requestBudgetImpact";
import {
  getPriorityChipColor,
  getStatusChipColor,
} from "@/utils/requestPresentation";
import { logError } from "@/utils/safeLogger";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

const previewTimestamp = {
  toDate: () => new Date("2026-06-29T19:54:28+05:30"),
};
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
const PREVIEW_REQUEST: PurchaseRequest = {
  id: "preview",
  title: "Quiet Air Purifier",
  productName: "Quiet Air Purifier",
  info: "Needed for better sleep and cleaner room air.",
  reason:
    "The room gets dusty quickly, and this keeps the space healthier without making noise.",
  priority: "P1",
  expectedPrice: 3500,
  maxBudget: 5000,
  budget: 5000,
  category: "Home",
  links: [{ source: "Amazon", url: "https://example.com/quiet-air-purifier" }],
  status: "pending",
  image: null,
  householdId: "preview-household",
  createdBy: "partner-a",
  createdByDisplayName: "Nitesh",
  createdByRoleLabel: "Partner A",
  createdAt: previewTimestamp,
  updatedAt: previewTimestamp,
  lastActivityAt: previewTimestamp,
  lastActivityType: "comment",
  commentCount: 3,
  lastCommentBy: "partner-b",
  lastCommentText: "Approved. Please buy the quieter model.",
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
    text: "Yes. INR 3,500, with INR 1,500 left after approval. https://example.com/quiet-air-purifier",
    link: "https://example.com/quiet-air-purifier",
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
  const { palette } = useHifeTheme();
  const screenTextColor = palette.chromeText;
  const screenMutedColor = palette.chromeMutedText;

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [householdRequests, setHouseholdRequests] = useState<PurchaseRequest[]>(
    []
  );
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(
    DEFAULT_BUDGET_SETTINGS
  );
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
      title: `${request?.productName || title || "Request"} - Discussion`,
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: palette.chrome },
      headerTintColor: palette.chromeText,
      headerTitleStyle: {
        color: palette.chromeText,
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
  }, [isPreview, navigation, palette.chrome, palette.chromeText, request?.productName, title]);

  useEffect(() => {
    if (isPreview) {
      setRequest(PREVIEW_REQUEST);
      setHouseholdRequests([PREVIEW_REQUEST]);
      setBudgetSettings(PREVIEW_BUDGET_SETTINGS);
      return;
    }

    let requestUnsubscribe: undefined | (() => void);
    let listUnsubscribe: undefined | (() => void);
    let cancelled = false;

    getBudgetSettings()
      .then(setBudgetSettings)
      .catch((error) => {
        logError("Failed to load discussion budget context", error);
      });

    subscribeToPurchaseRequest(
      taskId as string,
      (data: PurchaseRequest | null) => setRequest(data),
      (error: unknown) => {
        logError("Failed to listen for discussion request context", error);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        requestUnsubscribe = stop;
      }
    });

    subscribeToPurchaseRequests(
      (data: PurchaseRequest[]) => setHouseholdRequests(data),
      (error: unknown) => {
        logError("Failed to listen for discussion request list", error);
      }
    ).then((stop) => {
      if (cancelled) {
        stop();
      } else {
        listUnsubscribe = stop;
      }
    });

    return () => {
      cancelled = true;
      requestUnsubscribe?.();
      listUnsubscribe?.();
    };
  }, [isPreview, taskId]);

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
      async (data: Comment[]) => {
        setComments(data);
        setLoading(false);
        await markCommentsRead(taskId as string, data.length);

        if (!initialSnapshotSeen.current) {
          initialSnapshotSeen.current = true;
          return;
        }
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

  const addQuickReply = (reply: string) => {
    setText((current) => {
      const trimmed = current.trim();
      if (!trimmed) return reply;
      return `${trimmed}\n${reply}`;
    });
  };

  const budgetBeforeRequest = useMemo(
    () =>
      buildBudgetSummary(
        request
          ? householdRequests.filter((item) => item.id !== request.id)
          : householdRequests,
        budgetSettings
      ),
    [budgetSettings, householdRequests, request]
  );
  const categorySummary = request
    ? budgetBeforeRequest.categorySummaries.find(
        (item) => item.category === request.category
      )
    : null;
  const requestAmount = request ? getRequestAmount(request) : 0;
  const budgetImpact = request
    ? buildRequestBudgetImpact({
        amount: requestAmount,
        safeToSpend: budgetBeforeRequest.safeToSpend,
        categoryBudget: categorySummary?.budget || 0,
        categoryProjectedRemaining: categorySummary?.projectedRemaining || 0,
      })
    : null;
  const requestSummary = request
    ? buildDiscussionRequestSummary(request, budgetImpact)
    : null;
  const statusColor = request ? getStatusChipColor(request.status) : null;
  const urgencyColor = request ? getPriorityChipColor(request.priority) : null;
  const requestLinks: ProductLink[] = request?.links || [];
  const activeRequest = requestSummary && request ? request : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
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
          {requestSummary && activeRequest ? (
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: palette.card, borderBottomColor: palette.border },
              ]}
            >
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryTitleWrap}>
                  <Text style={styles.summaryEyebrow}>Discussing</Text>
                  <Text style={styles.summaryTitle} numberOfLines={2}>
                    {requestSummary.title}
                  </Text>
                </View>
                <Text style={styles.summaryAmount}>{requestSummary.amount}</Text>
              </View>

              <View style={styles.summaryChipsRow}>
                {statusColor ? (
                  <View
                    style={[
                      styles.summaryChip,
                      {
                        backgroundColor: statusColor.bg,
                        borderColor: statusColor.border,
                      },
                    ]}
                  >
                    <Text style={[styles.summaryChipText, { color: statusColor.text }]}>
                      {requestSummary.status}
                    </Text>
                  </View>
                ) : null}
                {urgencyColor ? (
                  <View
                    style={[
                      styles.summaryChip,
                      {
                        backgroundColor: urgencyColor.bg,
                        borderColor: urgencyColor.border,
                      },
                    ]}
                  >
                    <Text style={[styles.summaryChipText, { color: urgencyColor.text }]}>
                      {requestSummary.urgency}
                    </Text>
                  </View>
                ) : null}
                {activeRequest.category ? (
                  <Text style={styles.summaryCategory}>
                    {activeRequest.category}
                  </Text>
                ) : null}
              </View>

              <View style={styles.summaryBudgetRow}>
                <Ionicons name="wallet-outline" size={16} color="#7A8C6E" />
                <Text style={styles.summaryBudgetText}>
                  Safe to spend now: {formatInr(budgetImpact?.safeToSpendNow || 0)}
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryBudgetLine,
                  budgetImpact?.exceedsSafeToSpend
                    ? styles.summaryBudgetWarning
                    : null,
                ]}
              >
                {requestSummary.budgetLine}
              </Text>

              {activeRequest.lastCommentText ? (
                <View style={styles.latestActivityRow}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={15}
                    color="#776E64"
                  />
                  <Text style={styles.latestActivityText} numberOfLines={2}>
                    Latest note: {activeRequest.lastCommentText}
                  </Text>
                </View>
              ) : null}

              {requestLinks.length ? (
                <View style={styles.requestLinksRow}>
                  {requestLinks.slice(0, 2).map((item) => (
                    <Pressable
                      key={item.url}
                      style={styles.requestLinkPill}
                      onPress={() => openLink(item.url)}
                    >
                      <Ionicons name="link-outline" size={14} color="#A85C44" />
                      <Text style={styles.requestLinkText} numberOfLines={1}>
                        {item.source || "Product link"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.commentsContent}>
            {!loading && comments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: screenTextColor }]}>
                  No discussion yet
                </Text>
                <Text style={[styles.emptyText, { color: screenMutedColor }]}>
                  Add a note, product link, or question to start the decision.
                </Text>
              </View>
            )}

            {comments.map((item) => {
              const isMe = item.authorId === myUserId;
              const linkPreview = getCommentLinkPreview(item.text, item.link || "");

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

                  {linkPreview && (
                    <Pressable
                      style={styles.commentLinkButton}
                      onPress={() => openLink(linkPreview.url)}
                    >
                      <View style={styles.commentLinkIcon}>
                        <Ionicons name="link-outline" size={16} color="#A85C44" />
                      </View>
                      <View style={styles.commentLinkCopy}>
                        <Text style={styles.commentLinkSource}>
                          {linkPreview.source}
                        </Text>
                        <Text style={styles.commentLink}>
                          {linkPreview.url}
                        </Text>
                      </View>
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
            { backgroundColor: palette.chrome, borderColor: palette.border },
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.quickReplies}
          >
            {DISCUSSION_QUICK_REPLIES.map((reply) => (
              <Pressable
                key={reply}
                style={styles.quickReplyButton}
                disabled={isSending}
                onPress={() => addQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            placeholder="Add timing, budget risk, or missing info..."
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
              <Ionicons name="image-outline" size={22} color="#A85C44" />
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
              style={[
                styles.sendBtn,
                isSending || !text.trim() ? styles.disabledBtn : null,
              ]}
              disabled={isSending}
              onPress={handleAddComment}
            >
              <Ionicons name="send" size={18} color="#FFF9F0" />
              <Text style={styles.sendText}>{isSending ? "Sending" : "Send"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF6EE" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E8DECE",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  summaryTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  summaryEyebrow: {
    color: "#776E64",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    marginTop: 3,
  },
  summaryAmount: {
    color: "#3A2E28",
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
    maxWidth: "44%",
    textAlign: "right",
  },
  summaryChipsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  summaryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: "900",
  },
  summaryCategory: {
    color: "#665E54",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  summaryBudgetRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  summaryBudgetText: {
    color: "#4F6848",
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  summaryBudgetLine: {
    color: "#665E54",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 4,
  },
  summaryBudgetWarning: {
    color: "#873926",
  },
  latestActivityRow: {
    alignItems: "flex-start",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  latestActivityText: {
    color: "#665E54",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  requestLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  requestLinkPill: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: "48%",
    minHeight: 34,
    paddingHorizontal: 10,
  },
  requestLinkText: {
    color: "#A85C44",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
  },
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
    color: "#3A2E28",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#776E64",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  commentCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: "88%",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  myComment: {
    backgroundColor: "#FBEDE8",
    borderColor: "#A85C44",
    alignSelf: "flex-end",
  },
  otherComment: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    alignSelf: "flex-start",
  },
  commentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  authorText: {
    color: "#A85C44",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
  },
  rolePill: {
    backgroundColor: "rgba(200, 161, 90, 0.12)",
    borderColor: "#C4943A",
    borderRadius: 999,
    borderWidth: 1,
    color: "#7A5A12",
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentText: {
    color: "#3A2E28",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  myCommentText: {
    color: "#3A2E28",
  },
  commentImage: {
    height: 140,
    borderRadius: 8,
    marginVertical: 6,
  },
  commentLinkButton: {
    alignItems: "flex-start",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentLinkIcon: {
    alignItems: "center",
    backgroundColor: "#FFF9F0",
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  commentLinkCopy: {
    flex: 1,
    minWidth: 0,
  },
  commentLinkSource: {
    color: "#3A2E28",
    fontSize: 12,
    fontWeight: "900",
  },
  commentLink: {
    color: "#776E64",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  time: {
    fontSize: 10,
    color: "#776E64",
    alignSelf: "flex-end",
  },
  myTime: {
    color: "#8F867A",
  },
  inputArea: {
    borderTopWidth: 1,
    borderColor: "#E8DECE",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  selectedImageRow: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 44,
    padding: 8,
  },
  selectedImageRowError: {
    borderColor: "#A85C44",
  },
  selectedImageText: {
    color: "#3A2E28",
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
    backgroundColor: "#FFFFFF",
    minHeight: 58,
    maxHeight: 104,
    borderWidth: 1,
    borderColor: "#E8DECE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    color: "#3A2E28",
  },
  counterText: {
    color: "#8F867A",
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
  quickReplies: {
    gap: 8,
    paddingBottom: 10,
  },
  quickReplyButton: {
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderColor: "#E8DECE",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  quickReplyText: {
    color: "#3A2E28",
    fontSize: 12,
    fontWeight: "800",
  },
  linkInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DECE",
    borderRadius: 8,
    minHeight: 44,
    padding: 6,
    fontSize: 13,
    color: "#3A2E28",
  },
  sendBtn: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 82,
    paddingHorizontal: 12,
  },
  sendText: {
    color: "#FAF6EE",
    fontSize: 13,
    fontWeight: "900",
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
