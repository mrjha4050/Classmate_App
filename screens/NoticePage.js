import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { AuthContext } from "../AuthContext";
import { db } from "../config";

const NoticesScreen = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [filter, setFilter] = useState("All");
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Handle case where user is not authenticated
  if (!user || !user.uid) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          User not authenticated. Please log in.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const noticesCollection = collection(db, "notices");
        const noticesSnapshot = await getDocs(noticesCollection);
        const noticesList = noticesSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Safely handle the createdAt field (Firebase Timestamp, string, or number)
          let formattedDate = "Invalid Date";
          if (data.createdAt && data.createdAt.toDate) {
            // If it's a Firebase Timestamp
            formattedDate = data.createdAt.toDate().toLocaleString();
          } else if (data.createdAt && typeof data.createdAt === "string") {
            // If it's a string (e.g., ISO date like "2025-02-25T17:56:49.429Z")
            const parsedDate = new Date(data.createdAt);
            formattedDate = isNaN(parsedDate.getTime())
              ? "Invalid Date"
              : parsedDate.toLocaleString();
          } else if (data.createdAt && typeof data.createdAt === "number") {
            // If it's a Unix timestamp (milliseconds)
            formattedDate = new Date(data.createdAt).toLocaleString();
          }
          return {
            id: doc.id,
            title: data.title || "Untitled Notice",
            date: formattedDate, // Use createdAt instead of date, renamed for consistency
            teacher: data.noticeBy || "Unknown Teacher", // Map noticeBy to teacher
            content: data.content || "No content provided",
            tag: data.category || "All", // Map category to tag
            readBy: data.readBy || [], // Ensure readBy is an array
          };
        });
        setNotices(noticesList);
        filterNoticesByTagAndUser(noticesList, "All");
      } catch (error) {
        console.error("Error fetching notices:", error);
        Alert.alert("Error", "Failed to fetch notices. Please try again.");
      }
    };

    fetchNotices();
  }, []); // Empty dependency array to fetch only once on mount

  const filterNoticesByTagAndUser = (noticesList, tag) => {
    const filtered = noticesList.filter(
      (notice) =>
        (tag === "All" || notice.tag === tag) &&
        (!notice.readBy || !notice.readBy.includes(user.uid))
    );
    setFilteredNotices(filtered);
    setFilter(tag);
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      const notice = notices.find((n) => n.id === noticeId);
      if (!notice) {
        Alert.alert("Error", "Notice not found.");
        return;
      }

      const noticeRef = doc(db, "notices", noticeId);
      await updateDoc(noticeRef, {
        readBy: Array.isArray(notice.readBy)
          ? [...notice.readBy, user.uid]
          : [user.uid], // Ensure readBy is always an array
      });

      // Update local state
      setNotices(
        notices.map((n) =>
          n.id === noticeId
            ? {
                ...n,
                readBy: Array.isArray(n.readBy)
                  ? [...n.readBy, user.uid]
                  : [user.uid],
              }
            : n
        )
      );
      filterNoticesByTagAndUser(notices, filter);
      Alert.alert("Success", "Notice marked as read");
    } catch (error) {
      console.error("Error marking notice as read: ", error);
      Alert.alert("Error", "Failed to mark notice as read. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        {["All", "Announcement", "Sports", "TimeTable", "Event"].map(
          (tagName) => (
            <TouchableOpacity
              key={tagName}
              style={[
                styles.filterButton,
                filter === tagName && styles.filterButtonActive,
              ]}
              onPress={() => filterNoticesByTagAndUser(notices, tagName)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === tagName && styles.filterTextActive,
                ]}
              >
                {tagName}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
      <ScrollView contentContainerStyle={styles.noticesContainer}>
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.noticeCard}
              onPress={() => navigation.navigate("NoticeDetail", { notice })}
            >
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeDate}>Date: {notice.date}</Text>
              <Text style={styles.noticeTeacher}>
                Teacher: {notice.teacher}
              </Text>
              <Text style={styles.noticeContent}>{notice.content}</Text>
              <TouchableOpacity
                style={styles.markAsReadButton}
                onPress={() => handleMarkAsRead(notice.id)}
              >
                <Text style={styles.markAsReadText}>Mark as Read</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noNoticesText}>No unread notices available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    textAlign: "center",
    padding: 20,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  filterButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
  },
  filterText: {
    color: "#555",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
  },
  noticesContainer: {
    padding: 10,
  },
  noticeCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  noticeDate: {
    fontSize: 14,
    color: "#888",
    marginVertical: 5,
  },
  noticeTeacher: {
    fontSize: 14,
    color: "#888",
    marginVertical: 5,
  },
  noticeContent: {
    fontSize: 14,
    color: "#555",
  },
  markAsReadButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  markAsReadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  noNoticesText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    padding: 20,
  },
});

export default NoticesScreen;
