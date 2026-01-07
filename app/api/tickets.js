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

export async function createTicket({ title, info, priority, budget, image }) {
  const userId = await getDeviceUserId();
  return await addDoc(collection(db, "tasks"), {
    title,
    info,
    priority,
    budget,
    status: "open",
    createdBy: userId,
    createdAt: serverTimestamp(),
    image,
  });
}

export async function getTickets() {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      title: data.title || "",
      info: data.info || "",
      priority: data.priority || "P1",
      budget: data.budget || 0,
      status: data.status || "open",
      image: data.image || null,
      createdBy : data.createdBy || null,
      createdAt: data.createdAt || null,
    };
  });
}
