import { db } from "@/app/lib/firebase";
import { getDeviceUserId } from "@/utils/deviceUser";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Get comments for a task
 */
export async function getComments(taskId) {
  const q = query(
    collection(db, "tasks", taskId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      image: data.image || null,
      link: data.link || null,
      authorId: data.authorId,
      createdAt: data.createdAt?.toDate?.().toLocaleString() || "",
    };
  });
}

/**
 * Add comment to a task
 */
export async function addComment(taskId, comment) {
  const userId = await getDeviceUserId();
  await addDoc(collection(db, "tasks", taskId, "comments"), {
    text: comment.text,
    image: comment.image || null,
    link: comment.link || null,
    authorId: userId,
    createdAt: serverTimestamp(),
  });
}
