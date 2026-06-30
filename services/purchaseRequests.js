import { db } from "@/services/firebase";
import { getCurrentMember, requireActiveHousehold } from "@/services/households";
import { recordUsage } from "@/services/usageMonitoring";
import { getDeviceUserId } from "@/utils/deviceUser";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export function normalizeStatus(status) {
  if (!status || status === "open") return "pending";

  const validStatuses = new Set([
    "pending",
    "approved",
    "declined",
    "needs_more_info",
    "buy_later",
    "purchased",
    "cancelled",
  ]);

  return validStatuses.has(status) ? status : "pending";
}

export function mapRequestDoc(docSnapshot) {
  const data = docSnapshot.data();
  const title = data.title || data.productName || "";
  const reason = data.reason || data.info || "";
  const maxBudget = Number(data.maxBudget ?? data.budget ?? 0);
  const expectedPrice = Number(data.expectedPrice ?? maxBudget ?? 0);

  return {
    id: docSnapshot.id,
    title,
    productName: data.productName || title,
    info: data.info || reason,
    reason,
    priority: data.priority || "P1",
    expectedPrice,
    maxBudget,
    budget: maxBudget,
    category: data.category || "Other",
    purchaseTiming: data.purchaseTiming || "",
    purchaseType: data.purchaseType || "",
    links: Array.isArray(data.links) ? data.links : [],
    status: normalizeStatus(data.status),
    decisionReason: data.decisionReason || "",
    decisionBy: data.decisionBy || null,
    decisionAt: data.decisionAt || null,
    image: data.image || null,
    householdId: data.householdId || null,
    createdBy: data.createdBy || null,
    createdByDisplayName: data.createdByDisplayName || "",
    createdByRoleLabel: data.createdByRoleLabel || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    lastActivityAt: data.lastActivityAt || data.updatedAt || data.createdAt || null,
    lastActivityType: data.lastActivityType || "created",
    commentCount: Number(data.commentCount || 0),
    lastCommentBy: data.lastCommentBy || null,
    lastCommentText: data.lastCommentText || "",
  };
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

export function sortRequestsByCreatedAtDesc(requests) {
  return [...requests].sort(
    (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
  );
}

export async function createPurchaseRequest({
  productName,
  reason,
  priority,
  expectedPrice,
  maxBudget,
  category,
  purchaseTiming,
  purchaseType,
  links,
  image,
}) {
  const userId = await getDeviceUserId();
  const household = await requireActiveHousehold();
  const currentMember = await getCurrentMember();
  const member = currentMember?.member;
  const cleanProductName = productName.trim();
  const cleanReason = reason.trim();

  const docRef = await addDoc(collection(db, "tasks"), {
    householdId: household.id,
    title: cleanProductName,
    productName: cleanProductName,
    info: cleanReason,
    reason: cleanReason,
    priority,
    expectedPrice: Number(expectedPrice),
    maxBudget: Number(maxBudget),
    budget: Number(maxBudget),
    category,
    purchaseTiming: purchaseTiming || null,
    purchaseType: purchaseType || null,
    links,
    status: "pending",
    createdBy: userId,
    createdByDisplayName: member?.displayName || "Partner",
    createdByRoleLabel: member?.roleLabel || "Partner",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    lastActivityType: "created",
    commentCount: 0,
    image,
  });
  await recordUsage("requests.create", { writes: 1 });
  return docRef;
}

export async function getPurchaseRequests() {
  const household = await requireActiveHousehold();
  const q = query(
    collection(db, "tasks"),
    where("householdId", "==", household.id)
  );
  const snapshot = await getDocs(q);
  await recordUsage("requests.list", { reads: snapshot.size });
  return sortRequestsByCreatedAtDesc(snapshot.docs.map(mapRequestDoc));
}

export async function getPurchaseRequest(requestId) {
  const household = await requireActiveHousehold();
  const snapshot = await getDoc(doc(db, "tasks", requestId));
  await recordUsage("requests.read", { reads: 1 });

  if (!snapshot.exists()) {
    throw new Error("Purchase request not found");
  }

  const data = snapshot.data();

  if (data.householdId !== household.id) {
    throw new Error("Purchase request is outside this household");
  }

  return mapRequestDoc(snapshot);
}

export async function subscribeToPurchaseRequests(onNext, onError) {
  const household = await requireActiveHousehold();
  const q = query(
    collection(db, "tasks"),
    where("householdId", "==", household.id)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onNext(sortRequestsByCreatedAtDesc(snapshot.docs.map(mapRequestDoc)), snapshot);
      recordUsage("requests.listenSnapshot", { reads: snapshot.size });
    },
    onError
  );
}

export async function subscribeToPurchaseRequest(requestId, onNext, onError) {
  const household = await requireActiveHousehold();

  return onSnapshot(
    doc(db, "tasks", requestId),
    (snapshot) => {
      recordUsage("requests.listenOne", { reads: snapshot.exists() ? 1 : 0 });
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }

      if (snapshot.data().householdId !== household.id) {
        onError?.(new Error("Purchase request is outside this household"));
        return;
      }

      onNext(mapRequestDoc(snapshot));
    },
    onError
  );
}

export async function updatePurchaseRequestStatus(
  requestId,
  status,
  decisionReason
) {
  const userId = await getDeviceUserId();
  const household = await requireActiveHousehold();
  const snapshot = await getDoc(doc(db, "tasks", requestId));
  await recordUsage("requests.statusGuardRead", { reads: 1 });

  if (!snapshot.exists() || snapshot.data().householdId !== household.id) {
    throw new Error("Purchase request is outside this household");
  }

  await updateDoc(doc(db, "tasks", requestId), {
    status,
    decisionReason: decisionReason?.trim?.() || "",
    decisionBy: userId,
    decisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    lastActivityType: status,
  });
  await recordUsage("requests.statusUpdate", { writes: 1 });
}
