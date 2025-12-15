import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { WHITE, GRAY, BLACK } from "../color";

export const LoadingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate(HomeRoutes.WORKING);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

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

