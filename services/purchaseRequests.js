import { db } from "@/services/firebase";
import { getDeviceUserId } from "@/utils/deviceUser";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

function normalizeStatus(status) {
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

function mapRequestDoc(docSnapshot) {
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
    links: Array.isArray(data.links) ? data.links : [],
    status: normalizeStatus(data.status),
    decisionReason: data.decisionReason || "",
    decisionBy: data.decisionBy || null,
    decisionAt: data.decisionAt || null,
    image: data.image || null,
    createdBy: data.createdBy || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export async function createPurchaseRequest({
  productName,
  reason,
  priority,
  expectedPrice,
  maxBudget,
  category,
  links,
  image,
}) {
  const userId = await getDeviceUserId();
  const cleanProductName = productName.trim();
  const cleanReason = reason.trim();

  return await addDoc(collection(db, "tasks"), {
    title: cleanProductName,
    productName: cleanProductName,
    info: cleanReason,
    reason: cleanReason,
    priority,
    expectedPrice: Number(expectedPrice),
    maxBudget: Number(maxBudget),
    budget: Number(maxBudget),
    category,
    links,
    status: "pending",
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    image,
  });
}

export async function getPurchaseRequests() {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapRequestDoc);
}

export async function getPurchaseRequest(requestId) {
  const snapshot = await getDoc(doc(db, "tasks", requestId));

  if (!snapshot.exists()) {
    throw new Error("Purchase request not found");
  }

  return mapRequestDoc(snapshot);
}

export async function updatePurchaseRequestStatus(
  requestId,
  status,
  decisionReason
) {
  const userId = await getDeviceUserId();

  await updateDoc(doc(db, "tasks", requestId), {
    status,
    decisionReason: decisionReason?.trim?.() || "",
    decisionBy: userId,
    decisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
