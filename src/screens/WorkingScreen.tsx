import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert, BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { BLACK, WHITE, GRAY, RED } from "../color";
import Socket from "react-native-tcp-socket";

const BORDER_WIDTH = 0.2;
const SOCKET_PORT = 9000;

export const WorkingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const route = useRoute();
  const socketRef = useRef<Socket.Socket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const failureHandledRef = useRef<boolean>(false);

  useEffect(() => {
    const socketHost = (route.params as { socketHost: string })?.socketHost || "192.168.50.1";
    
    // TCP 소켓 연결
    console.log("소켓 연결 시도:", `${socketHost}:${SOCKET_PORT}`);
    console.log("연결 시작 시간:", new Date().toISOString());

    const handleConnectionFailure = () => {
      if (!failureHandledRef.current) {
        failureHandledRef.current = true;
        // console.error("연결 실패 처리 시작");
        Alert.alert("서버 연결 실패했습니다", "서버와의 연결이 끊어졌습니다.", [
          {
            text: "확인",
            onPress: () => {
              navigation.navigate(HomeRoutes.HOME);
            },
          },
        ]);
      }
    };

    const handleDisconnection = () => {
      if (isConnectedRef.current && !failureHandledRef.current) {
        // 연결 후 끊어진 경우
        // console.error("작업 중 연결 끊김");
        Alert.alert("연결이 끊어졌습니다", "서버와의 연결이 끊어졌습니다. 홈으로 돌아갑니다.", [
          {
            text: "확인",
            onPress: () => {
              navigation.navigate(HomeRoutes.HOME);
            },
          },
        ]);
      }
    };
    
    try {
      const socket = Socket.createConnection(
        {
          host: socketHost,
          port: SOCKET_PORT,
        },
        () => {
          // 연결 성공
          console.log("소켓 연결 성공");
          console.log("연결 성공 시간:", new Date().toISOString());
          isConnectedRef.current = true;
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
        }
      );

      // 연결 타임아웃 설정 (30초)
      connectionTimeoutRef.current = setTimeout(() => {
        // console.error("연결 타임아웃 (30초 경과)");
        if (socketRef.current) {
          socketRef.current.destroy();
        }
        handleConnectionFailure();
      }, 30000);

      socket.on("data", (data) => {
        const dataString = data.toString();
        console.log("받은 데이터:", dataString);
        // JSON 데이터인 경우 파싱 시도
        try {
          const parsed = JSON.parse(dataString);
          console.log("파싱된 데이터:", parsed);
        } catch (e) {
          // JSON이 아니면 그대로 출력
        }
      });

      socket.on("error", (error) => {
        // console.error("소켓 에러 발생");
        // console.error("에러 시간:", new Date().toISOString());
        // console.error("에러 상세:", error);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (!isConnectedRef.current) {
          // 연결 전 에러인 경우
          handleConnectionFailure();
        } else {
          // 연결 후 에러인 경우
          handleDisconnection();
        }
      });

      socket.on("close", () => {
        console.log("소켓 연결 종료");
        console.log("종료 시간:", new Date().toISOString());
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        // 연결 성공하지 않은 경우 실패 처리
        if (!isConnectedRef.current && !failureHandledRef.current) {
          setTimeout(() => {
            handleConnectionFailure();
          }, 100);
        } else if (isConnectedRef.current && !failureHandledRef.current) {
          // 연결 후 끊어진 경우
          handleDisconnection();
        }
      });

      socketRef.current = socket;

      // 컴포넌트 언마운트 시 연결 종료
      return () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (socketRef.current) {
          console.log("컴포넌트 언마운트 - 소켓 연결 종료");
          socketRef.current.destroy();
          socketRef.current = null;
        }
      };
    } catch (error) {
      // console.error("TCP 소켓 생성 실패:", error);
      handleConnectionFailure();
    }
  }, [navigation, route]);

  const handleExit = () => {
    Alert.alert("종료하시겠습니까?", "", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "확인",
        onPress: () => {
          // 소켓 연결 종료
          if (socketRef.current) {
            console.log("종료 확인 - 소켓 연결 종료");
            socketRef.current.destroy();
            socketRef.current = null;
          }
          navigation.navigate(HomeRoutes.HOME);
        },
      },
    ]);
  };

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleExit();
      return true; // 기본 뒤로가기 동작 방지
    });

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleExit}>
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
        <View style={styles.circle4} />

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
      <Pressable style={styles.endButton} onPress={handleExit}>
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
    flex: 0.85,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
  },
  circle2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: BORDER_WIDTH,
    borderColor: RED,
  },
  circle3: {
    position: "absolute",
    width: 450,
    height: 450,
    borderRadius: 250,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
  },
  circle4: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
  },
  horizontalLine: {
    position: "absolute",
    width: "100%",
    height: BORDER_WIDTH,
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
    right: "5%",
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
