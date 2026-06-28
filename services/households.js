import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/services/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const ACTIVE_HOUSEHOLD_KEY = "HIFE_ACTIVE_HOUSEHOLD_ID";

function makeInviteCode() {
  return nanoid(6).replace(/[^a-z0-9]/gi, "").toUpperCase().padEnd(6, "H");
}

function memberData(displayName, roleLabel) {
  return {
    displayName: displayName.trim(),
    roleLabel: roleLabel.trim() || "Partner",
    joinedAt: serverTimestamp(),
  };
}

function mapHouseholdDoc(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: data.name || "Hife Household",
    inviteCode: data.inviteCode,
    monthlyBudget: Number(data.monthlyBudget || 0),
    categoryBudgets: data.categoryBudgets || {},
    createdBy: data.createdBy,
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    members: data.members || {},
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function rememberHousehold(householdId) {
  await AsyncStorage.setItem(ACTIVE_HOUSEHOLD_KEY, householdId);
}

export async function createHousehold({
  displayName,
  roleLabel = "Partner A",
  name = "Hife Household",
}) {
  const user = await getCurrentUser();
  const inviteCode = makeInviteCode();

  const householdRef = await addDoc(collection(db, "households"), {
    name: name.trim() || "Hife Household",
    inviteCode,
    createdBy: user.uid,
    memberIds: [user.uid],
    members: {
      [user.uid]: memberData(displayName, roleLabel),
    },
    monthlyBudget: 0,
    categoryBudgets: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await rememberHousehold(householdRef.id);

  return {
    id: householdRef.id,
    name: name.trim() || "Hife Household",
    inviteCode,
    monthlyBudget: 0,
    categoryBudgets: {},
    createdBy: user.uid,
    memberIds: [user.uid],
    members: {
      [user.uid]: {
        displayName: displayName.trim(),
        roleLabel: roleLabel.trim() || "Partner A",
      },
    },
  };
}

export async function joinHouseholdByInviteCode({
  inviteCode,
  displayName,
  roleLabel = "Partner B",
}) {
  const user = await getCurrentUser();
  const normalizedCode = inviteCode.trim().toUpperCase();

  const householdQuery = query(
    collection(db, "households"),
    where("inviteCode", "==", normalizedCode),
    limit(1)
  );
  const snapshot = await getDocs(householdQuery);

  if (snapshot.empty) {
    throw new Error("No household found for that invite code");
  }

  const householdDoc = snapshot.docs[0];
  const memberPath = `members.${user.uid}`;

  await updateDoc(doc(db, "households", householdDoc.id), {
    memberIds: arrayUnion(user.uid),
    [memberPath]: memberData(displayName, roleLabel),
    updatedAt: serverTimestamp(),
  });

  await rememberHousehold(householdDoc.id);

  const updatedSnapshot = await getDoc(doc(db, "households", householdDoc.id));
  return mapHouseholdDoc(updatedSnapshot);
}

export async function getActiveHousehold() {
  const user = await getCurrentUser();
  const rememberedId = await AsyncStorage.getItem(ACTIVE_HOUSEHOLD_KEY);

  if (rememberedId) {
    const snapshot = await getDoc(doc(db, "households", rememberedId));

    if (snapshot.exists()) {
      const household = mapHouseholdDoc(snapshot);

      if (household.memberIds.includes(user.uid)) {
        return household;
      }
    }
  }

  const membershipQuery = query(
    collection(db, "households"),
    where("memberIds", "array-contains", user.uid),
    limit(1)
  );
  const snapshot = await getDocs(membershipQuery);

  if (snapshot.empty) return null;

  const household = mapHouseholdDoc(snapshot.docs[0]);
  await rememberHousehold(household.id);
  return household;
}

export async function requireActiveHousehold() {
  const household = await getActiveHousehold();

  if (!household) {
    throw new Error("Create or join a household before using requests");
  }

  return household;
}

export async function getCurrentMember() {
  const user = await getCurrentUser();
  const household = await getActiveHousehold();

  if (!household) return null;

  return {
    userId: user.uid,
    household,
    member: household.members[user.uid] || null,
  };
}
