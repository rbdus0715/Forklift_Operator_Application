import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { WHITE, GRAY, BLACK } from "../color";
import Socket from "react-native-tcp-socket";

const SOCKET_PORT = 9000;

export const LoadingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const route = useRoute();
  const { socketHost } = route.params as { socketHost: string };
  const socketRef = useRef<Socket.Socket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const failureHandledRef = useRef<boolean>(false);

  useEffect(() => {
    console.log("소켓 연결 시도:", `${socketHost}:${SOCKET_PORT}`);
    console.log("연결 시작 시간:", new Date().toISOString());

    const handleConnectionFailure = () => {
      if (!isConnectedRef.current && !failureHandledRef.current) {
        failureHandledRef.current = true;
        console.error("연결 실패 처리 시작");
        Alert.alert("서버 연결 실패했습니다", "", [
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
          console.log("✅ 소켓 연결 성공");
          console.log("연결 성공 시간:", new Date().toISOString());
          isConnectedRef.current = true;
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          // 연결 성공 시 WorkingScreen으로 이동
          socket.destroy(); // LoadingScreen에서는 연결을 닫고, WorkingScreen에서 다시 연결
          navigation.navigate(HomeRoutes.WORKING, { socketHost });
        }
      );

      // 연결 타임아웃 설정 (30초)
      connectionTimeoutRef.current = setTimeout(() => {
        console.error("❌ 연결 타임아웃 (30초 경과)");
        if (socketRef.current) {
          socketRef.current.destroy();
        }
        handleConnectionFailure();
      }, 30000);

      socket.on("error", (error) => {
        console.error("❌ 소켓 에러 발생");
        console.error("에러 시간:", new Date().toISOString());
        console.error("에러 상세:", error);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        handleConnectionFailure();
      });

      socket.on("close", () => {
        console.log("🔌 소켓 연결 종료");
        console.log("종료 시간:", new Date().toISOString());
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        // 연결 성공하지 않은 경우 실패 처리
        if (!isConnectedRef.current) {
          setTimeout(() => {
            handleConnectionFailure();
          }, 100);
        }
      });

      socketRef.current = socket;

      // 컴포넌트 언마운트 시 정리
      return () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.destroy();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error("❌ TCP 소켓 생성 실패:", error);
      handleConnectionFailure();
    }
  }, [navigation, socketHost]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>서버와의 접속을</Text>
      <Text style={styles.text}>확인중입니다.</Text>
      <ActivityIndicator size="large" color={BLACK} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: GRAY,
    textAlign: "center",
    marginBottom: 4,
  },
  spinner: {
    marginTop: 30,
  },
});

