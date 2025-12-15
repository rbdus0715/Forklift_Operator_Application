import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Share, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeNavigation } from "../navigations/types";
import { HomeRoutes } from "../navigations/routes";
import { WHITE, BLACK } from "../color";
import LogCard, { WarningLog } from "../components/LogCard/LogCard";
import { useFontSize } from "../contexts/FontSizeContext";

const WARNING_LOGS_KEY = "@warning_logs";

const LogScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { fontSize } = useFontSize();
  const isLarge = fontSize === "large";
  const [logs, setLogs] = useState<WarningLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const logsJson = await AsyncStorage.getItem(WARNING_LOGS_KEY);
      if (logsJson) {
        const parsedLogs = JSON.parse(logsJson);
        // 최신순으로 정렬
        const sortedLogs = parsedLogs.sort((a: WarningLog, b: WarningLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("로그 불러오기 실패:", error);
      setLogs([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, []);

  // 로그 비우기
  const handleClearLogs = () => {
    Alert.alert(
      "로그 삭제",
      "모든 경고 기록을 삭제하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(WARNING_LOGS_KEY);
              setLogs([]);
            } catch (error) {
              console.error("로그 삭제 실패:", error);
              Alert.alert("오류", "로그 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  // CSV로 내보내기
  const handleExportCSV = async () => {
    if (logs.length === 0) {
      Alert.alert("알림", "내보낼 로그가 없습니다.");
      return;
    }

    try {
      // CSV 헤더
      const csvHeader = "날짜,시간,거리(m),지속시간(초),타임스탬프\n";
      
      // CSV 데이터 생성
      const csvRows = logs.map((log) => {
        const duration = log.duration !== undefined ? log.duration.toFixed(1) : "";
        return `${log.date},${log.time},${log.distance.toFixed(2)},${duration},${log.timestamp}`;
      });
      
      const csvContent = csvHeader + csvRows.join("\n");
      
      // 파일명 생성 (현재 날짜/시간 포함)
      const now = new Date();
      const fileName = `경고기록_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.csv`;
      
      // Share API를 사용하여 CSV 공유
      const result = await Share.share({
        message: csvContent,
        title: fileName,
      });

      if (result.action === Share.sharedAction) {
        console.log("CSV 파일 공유 성공");
      }
    } catch (error) {
      console.error("CSV 내보내기 실패:", error);
      Alert.alert("오류", "CSV 파일 내보내기에 실패했습니다.");
    }
  };

  // 화면이 포커스될 때마다 로그 불러오기
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, isLarge && styles.backIconLarge]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>경고 기록 세부</Text>
        <Pressable style={styles.uploadButton} onPress={handleExportCSV}>
          <Text style={[styles.uploadIcon, isLarge && styles.uploadIconLarge]}>↑</Text>
        </Pressable>
      </View>

      {/* 카드 리스트 */}
      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isLarge && styles.emptyTextLarge]}>경고 기록이 없습니다</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {logs.map((log) => (
            <LogCard key={log.id} log={log} />
          )          )}
        </ScrollView>
      )}

      {/* 로그 비우기 버튼 */}
      {logs.length > 0 && (
        <View style={styles.footer}>
          <Pressable style={styles.clearButton} onPress={handleClearLogs}>
            <Text style={[styles.clearButtonText, isLarge && styles.clearButtonTextLarge]}>로그 목록 비우기</Text>
          </Pressable>
        </View>
      )}
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
    fontSize: 25,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: BLACK,
    opacity: 0.5,
  },
  footer: {
    padding: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: WHITE,
  },
  clearButton: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: WHITE,
  },
  backIconLarge: {
    fontSize: 30,
  },
  headerTitleLarge: {
    fontSize: 31,
  },
  uploadIconLarge: {
    fontSize: 30,
  },
  emptyTextLarge: {
    fontSize: 20,
  },
  clearButtonTextLarge: {
    fontSize: 20,
  },
});

export default LogScreen;
