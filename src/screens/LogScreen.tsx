import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HomeNavigation } from "../navigations/types";
import { WHITE, PRIMARY, GRAY, BLACK } from "../color";
import LogCard from "../components/LogCard/LogCard";

const LogScreen = () => {
  const navigation = useNavigation<HomeNavigation>();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>경고 기록 세부</Text>
        <Pressable style={styles.uploadButton}>
          <Text style={styles.uploadIcon}>↑</Text>
        </Pressable>
      </View>

      {/* 카드 리스트 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <LogCard />
        <LogCard />
        <LogCard />
        <LogCard />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: BLACK,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BLACK,
    flex: 1,
    textAlign: "center",
  },
  uploadButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 24,
    color: BLACK,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },

});

export default LogScreen;
