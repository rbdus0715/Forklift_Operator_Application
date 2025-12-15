import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { WHITE, GRAY, BLACK } from "../color";

export const LoadingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const route = useRoute();

  useEffect(() => {
    const socketHost = (route.params as { socketHost: string })?.socketHost || "192.168.50.1";
    const timer = setTimeout(() => {
      // 로딩 화면을 제거하고 홈 화면과 작업 화면만 스택에 남김
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: HomeRoutes.HOME },
            { name: HomeRoutes.WORKING, params: { socketHost } },
          ],
        })
      );
    }, 3000);

    return () => clearTimeout(timer);
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

