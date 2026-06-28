import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserId } from "@/services/auth";
import { nanoid } from "nanoid/non-secure";

const USER_KEY = "HIFE_DEVICE_USER_ID";

export async function getDeviceUserId() {
  try {
    return await getCurrentUserId();
  } catch {
    if (__DEV__) {
      console.warn("Falling back to local device user id");
    }
  }

  let userId = await AsyncStorage.getItem(USER_KEY);

  if (!userId) {
    userId = `user_${nanoid(8)}`;
    await AsyncStorage.setItem(USER_KEY, userId);
  }

  return userId;
}
