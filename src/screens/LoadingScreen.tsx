import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { WHITE, GRAY, BLACK } from "../color";
import Socket from "react-native-tcp-socket";

const SOCKET_PORT = 9000;
const CONNECTION_TIMEOUT = 30000; // 30초

export const LoadingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const route = useRoute();
  const socketRef = useRef<Socket.Socket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const failureHandledRef = useRef<boolean>(false);

  useEffect(() => {
    const socketHost = (route.params as { socketHost: string })?.socketHost || "192.168.50.1";
    
    console.log("소켓 연결 시도:", `${socketHost}:${SOCKET_PORT}`);
    console.log("연결 시작 시간:", new Date().toISOString());

    const handleConnectionFailure = () => {
      if (!failureHandledRef.current) {
        failureHandledRef.current = true;
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

    const handleConnectionSuccess = () => {
      if (!failureHandledRef.current) {
        isConnectedRef.current = true;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        console.log("소켓 연결 성공");
        console.log("연결 성공 시간:", new Date().toISOString());
        // 연결 성공 시 WorkingScreen으로 이동
        navigation.navigate(HomeRoutes.WORKING, { socketHost });
      }
    };

    try {
      const socket = Socket.createConnection(
        {
          host: socketHost,
          port: SOCKET_PORT,
        },
        () => {
          // 연결 성공 콜백
          handleConnectionSuccess();
        }
      );

      // 연결 타임아웃 설정
      connectionTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && !isConnectedRef.current) {
          socketRef.current.destroy();
          handleConnectionFailure();
        }
      }, CONNECTION_TIMEOUT);

      socket.on("error", (error) => {
        console.error("소켓 에러 발생:", error);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (!isConnectedRef.current) {
          handleConnectionFailure();
        }
      });

      socket.on("close", () => {
        console.log("소켓 연결 종료");
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (!isConnectedRef.current && !failureHandledRef.current) {
          setTimeout(() => {
            handleConnectionFailure();
          }, 100);
        }
      });

      socketRef.current = socket;

      // 컴포넌트 언마운트 시 연결 종료
      return () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (socketRef.current && !isConnectedRef.current) {
          console.log("컴포넌트 언마운트 - 소켓 연결 종료");
          socketRef.current.destroy();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error("TCP 소켓 생성 실패:", error);
      handleConnectionFailure();
    }
  }, [navigation, route]);

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

