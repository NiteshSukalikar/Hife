import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

const USER_KEY = "HIFE_DEVICE_USER_ID";

export async function getDeviceUserId() {
  let userId = await AsyncStorage.getItem(USER_KEY);

  if (!userId) {
    userId = `user_${nanoid(8)}`;
    await AsyncStorage.setItem(USER_KEY, userId);
  }

  return userId;
}
