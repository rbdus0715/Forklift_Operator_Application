import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { BLACK, WHITE, GRAY } from "../color";

export const WorkingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();

  const handleBackPress = () => {
    navigation.navigate(HomeRoutes.HOME);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>작업 중</Text>
        <Pressable style={styles.placeholderButton}>
          <Text style={styles.placeholderIcon}></Text>
        </Pressable>
      </View>

      {/* 레이더 스타일 디스플레이 */}
      <View style={styles.radarContainer}>
        {/* 동심원들 */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        
        {/* 수평선 */}
        <View style={styles.horizontalLine} />
        
        {/* 중앙 원 */}
        <View style={styles.centerCircle} />
        
        {/* 거리 표시 */}
        <Text style={styles.distanceText}>3m</Text>
        
        {/* 사용자 아이콘 (왼쪽 상단) */}
        <View style={styles.userIcon}>
          <Text style={styles.userIconText}>👤</Text>
        </View>
      </View>

      {/* 종료 버튼 */}
      <Pressable style={styles.endButton}>
        <Text style={styles.endButtonText}>종료</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
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
    color: WHITE,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: WHITE,
    flex: 1,
    textAlign: "center",
  },
  placeholderButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 24,
    color: BLACK,
  },
  radarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: GRAY,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: GRAY,
  },
  circle3: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  horizontalLine: {
    position: "absolute",
    width: "80%",
    height: 1,
    backgroundColor: GRAY,
  },
  centerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: WHITE,
    position: "absolute",
  },
  distanceText: {
    position: "absolute",
    right: "25%",
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "600",
  },
  userIcon: {
    position: "absolute",
    top: "30%",
    left: "25%",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
  },
  userIconText: {
    fontSize: 24,
  },
  endButton: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    height: 60,
    backgroundColor: "#FFA500",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: BLACK,
  },
});

