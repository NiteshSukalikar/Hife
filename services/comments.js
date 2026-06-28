import { db } from "@/services/firebase";
import { getCurrentMember, requireActiveHousehold } from "@/services/households";
import { getDeviceUserId } from "@/utils/deviceUser";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

function mapCommentDoc(docSnapshot) {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    text: data.text,
    image: data.image || null,
    link: data.link || null,
    householdId: data.householdId || null,
    authorId: data.authorId,
    authorDisplayName: data.authorDisplayName || "",
    authorRoleLabel: data.authorRoleLabel || "",
    createdAt: data.createdAt?.toDate?.().toLocaleString() || "",
    createdAtRaw: data.createdAt || null,
  };
}

async function verifyHouseholdRequest(taskId) {
  const household = await requireActiveHousehold();
  const requestSnapshot = await getDoc(doc(db, "tasks", taskId));

  if (
    !requestSnapshot.exists() ||
    requestSnapshot.data().householdId !== household.id
  ) {
    throw new Error("Discussion is outside this household");
  }

  return household;
}

export async function getComments(taskId) {
  await verifyHouseholdRequest(taskId);
  const q = query(
    collection(db, "tasks", taskId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(mapCommentDoc);
}

export async function subscribeToComments(taskId, onNext, onError) {
  await verifyHouseholdRequest(taskId);
  const q = query(
    collection(db, "tasks", taskId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onNext(snapshot.docs.map(mapCommentDoc), snapshot);
    },
    onError
  );
}

export async function addComment(taskId, comment) {
  const userId = await getDeviceUserId();
  const household = await verifyHouseholdRequest(taskId);
  const currentMember = await getCurrentMember();
  const member = currentMember?.member;

  await addDoc(collection(db, "tasks", taskId, "comments"), {
    householdId: household.id,
    text: comment.text,
    image: comment.image || null,
    link: comment.link || null,
    authorId: userId,
    authorDisplayName: member?.displayName || "Partner",
    authorRoleLabel: member?.roleLabel || "Partner",
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "tasks", taskId), {
    commentCount: increment(1),
    lastCommentBy: userId,
    lastCommentText: comment.text,
    lastActivityAt: serverTimestamp(),
    lastActivityType: "comment",
    updatedAt: serverTimestamp(),
  });
}
