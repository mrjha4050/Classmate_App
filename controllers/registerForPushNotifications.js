import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config"; // Your Firestore config
import { getAuth } from "firebase/auth";

export const registerForPushNotifications = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("No authenticated user found.");
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Push notification permissions denied!");
    return;
  }

  const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", expoPushToken);

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { expoPushToken }, { merge: true });
    console.log("Push token saved successfully!");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};