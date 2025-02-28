import React, { createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./config"; // Adjust the path to your Firebase config
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Fetch user role from Firestore (e.g., from 'users' or 'teachersinfo' collection)
          const userDocRef = doc(db, "users", authUser.uid); // Adjust collection name if 'teachersinfo' or another
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Assuming the role is stored as a field in Firestore (e.g., 'role')
            const role = userData.role || "student"; // Default to "student" if no role
            setUser({ ...authUser, role }); // Add role to the user object
          } else {
            // If user document doesn’t exist, assume a default role or create it
            console.warn(`User document not found for UID: ${authUser.uid}`);
            setUser({ ...authUser, role: "student" }); // Default to "student" if not found
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          // Fallback to user without role or with a default role
          setUser({ ...authUser, role: "student" });
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
