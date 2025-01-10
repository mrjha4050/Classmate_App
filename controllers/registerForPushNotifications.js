import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../config"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const registerForPushNotifications = async () => {
  const auth = getAuth();

  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.error("No authenticated user found.");
        reject(new Error("No authenticated user found."));
        return;
      }

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.warn("Push notification permissions denied!");
          resolve(null);
          return;
        }

        const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", expoPushToken);

        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { expoPushToken }, { merge: true });
        console.log("Push token saved successfully!");

        resolve(expoPushToken);
      } catch (error) {
        console.error("Error saving push token:", error);
        reject(error);
      }
    });
  });
};