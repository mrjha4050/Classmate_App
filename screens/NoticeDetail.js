import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db } from "../config";
import { doc, getDoc } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

const NoticeDetail = () => {
  const route = useRoute();
  const { noticeId } = route.params;
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchNoticeDetails = async () => {
      try {
        if (!noticeId) {
          throw new Error("No notice ID provided");
        }

        const noticeDocRef = doc(db, "notices", noticeId);
        const docSnap = await getDoc(noticeDocRef);

        if (docSnap.exists()) {
          const noticeData = docSnap.data();
          // Process the notice data according to your Firestore structure
          const processedNotice = {
            id: docSnap.id,
            title: noticeData.title || "No Title",
            content: noticeData.content || "No content available",
            noticeBy: noticeData.noticeBy || "Unknown sender",
            category: noticeData.category || "general",
            createdAt: noticeData.createdAt || null,
            files: noticeData.files || null,
            readBy: noticeData.readBy || [],
          };
          setNotice(processedNotice);
        } else {
          setError("Notice not found");
        }
      } catch (err) {
        console.error("Error fetching notice:", err);
        setError(err.message || "Failed to load notice");
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeDetails();
  }, [noticeId]);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleOpenFile = (fileUrl) => {
    if (fileUrl) {
      Linking.canOpenURL(fileUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(fileUrl);
          } else {
            console.log("Don't know how to open URI: " + fileUrl);
            Alert.alert("Error", "No app available to open this file");
          }
        })
        .catch((err) => {
          console.error("Failed to open URL:", err);
          Alert.alert("Error", "Could not open file");
        });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b4cca" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!notice) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text>Notice not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{notice.category}</Text>
          </View>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.date}>{formatDate(notice.createdAt)}</Text>
        </View>

        <View style={styles.senderContainer}>
          <FontAwesome name="user-circle" size={16} color="#666" />
          <Text style={styles.senderLabel}>Posted by: </Text>
          <Text style={styles.sender}>{notice.noticeBy}</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text
            style={styles.content}
            numberOfLines={expanded ? undefined : 5}
          >
            {notice.content}
          </Text>
          {notice.content.length > 200 && (
            <TouchableOpacity onPress={toggleExpand}>
              <Text style={styles.readMore}>
                {expanded ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {notice.files && (
          <View style={styles.filesContainer}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {typeof notice.files === "string" ? (
              <TouchableOpacity
                style={styles.fileItem}
                onPress={() => handleOpenFile(notice.files)}
              >
                <MaterialIcons name="attach-file" size={20} color="#3b4cca" />
                <Text style={styles.fileText}>View Attachment</Text>
              </TouchableOpacity>
            ) : (
              notice.files.map((file, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.fileItem}
                  onPress={() => handleOpenFile(file)}
                >
                  <MaterialIcons name="attach-file" size={20} color="#3b4cca" />
                  <Text style={styles.fileText}>Attachment {index + 1}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.readByContainer}>
          <Text style={styles.sectionTitle}>
            Read by {notice.readBy.length} people
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  categoryBadge: {
    backgroundColor: "#e1f5fe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  categoryText: {
    color: "#0288d1",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  senderLabel: {
    color: "#666",
    marginLeft: 5,
    marginRight: 5,
  },
  sender: {
    fontWeight: "bold",
    color: "#333",
  },
  contentContainer: {
    marginBottom: 25,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  readMore: {
    color: "#3b4cca",
    marginTop: 5,
    fontWeight: "bold",
  },
  filesContainer: {
    marginBottom: 20,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    marginTop: 10,
  },
  fileText: {
    marginLeft: 10,
    color: "#3b4cca",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  readByContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});

export default NoticeDetail;