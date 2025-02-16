// // controllers/registerForPushNotifications.js
// import * as Notifications from "expo-notifications";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";
// import { db } from "../config";

// export const registerForPushNotifications = async () => {
//   const auth = getAuth();

//   return new Promise((resolve, reject) => {
//     onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         console.error("No authenticated user found.");
//         reject(new Error("No authenticated user found."));
//         return;
//       }

//       try {
//         const { status } = await Notifications.requestPermissionsAsync();
//         if (status !== "granted") {
//           console.warn("Push notification permissions denied!");
//           resolve(null);
//           return;
//         }

//         const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
//         console.log("Expo Push Token:", expoPushToken);

//         const userRef = doc(db, "users", user.uid);
//         await setDoc(userRef, { expoPushToken }, { merge: true });
//         console.log("Expo push token saved successfully!");

//         resolve(expoPushToken);
//       } catch (error) {
//         console.error("Error saving Expo push token:", error);
//         reject(error);
//       }
//     });
//   });
// };


import * as Notifications from "expo-notifications";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config";

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
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Push notification permissions denied!");
          resolve(null);
          return;
        }

        let expoPushToken;
        try {
          expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
          console.log("Expo Push Token:", expoPushToken);
        } catch (tokenError) {
          console.error("Error fetching Expo push token:", tokenError);
          await new Promise((resolve) => setTimeout(resolve, 5000));  
          expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
          console.log("Retried Expo Push Token:", expoPushToken);
        }

        if (!expoPushToken) {
          console.error("Failed to fetch Expo push token after retry.");
          reject(new Error("Failed to fetch Expo push token."));
          return;
        }

        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { expoPushToken }, { merge: true });
        console.log("Expo push token saved successfully!");

        resolve(expoPushToken);
      } catch (error) {
        console.error("Error in registerForPushNotifications:", error);
        reject(error);
      }
    });
  });
};