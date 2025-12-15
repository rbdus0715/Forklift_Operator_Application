import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { SvgXml } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GRAY, PRIMARY, WHITE } from "../color";
import { useNavigation } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";

const SOCKET_HOST_KEY = "@socket_host";

export const HomeScreen = () => {
  const logoSvg = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="19" fill="#015CAE"/>
<path d="M18.9982 28.48C18.1182 28.48 17.3682 28.18 16.7482 27.58C16.1482 26.98 15.8482 26.25 15.8482 25.39C15.8482 24.51 16.1482 23.77 16.7482 23.17C17.3682 22.57 18.1182 22.27 18.9982 22.27C19.8782 22.27 20.6182 22.57 21.2182 23.17C21.8382 23.77 22.1482 24.51 22.1482 25.39C22.1482 26.25 21.8382 26.98 21.2182 27.58C20.6182 28.18 19.8782 28.48 18.9982 28.48ZM18.9982 8.17C19.9982 8.17 20.7982 8.45 21.3982 9.01C22.0182 9.55 22.3282 10.34 22.3282 11.38C22.3282 11.92 22.2282 12.67 22.0282 13.63C21.8282 14.59 21.4082 15.96 20.7682 17.74L19.8982 20.11H18.0982L17.2282 17.74C16.5682 15.96 16.1382 14.59 15.9382 13.63C15.7582 12.67 15.6682 11.92 15.6682 11.38C15.6682 10.34 15.9682 9.55 16.5682 9.01C17.1682 8.45 17.9782 8.17 18.9982 8.17Z" fill="white"/>
</svg>`;
  const navigation = useNavigation<HomeNavigation>();
  const [socketHost, setSocketHost] = useState("192.168.50.1");

  // 저장된 IP 불러오기
  useEffect(() => {
    const loadSavedHost = async () => {
      try {
        const savedHost = await AsyncStorage.getItem(SOCKET_HOST_KEY);
        if (savedHost) {
          setSocketHost(savedHost);
        }
      } catch (error) {
        console.error("저장된 IP 불러오기 실패:", error);
      }
    };
    loadSavedHost();
  }, []);

  // IP 변경 시 저장
  const handleHostChange = async (text: string) => {
    setSocketHost(text);
    try {
      await AsyncStorage.setItem(SOCKET_HOST_KEY, text);
    } catch (error) {
      console.error("IP 저장 실패:", error);
    }
  };

  const handleStart = () => {
    if (!socketHost.trim()) {
      Alert.alert("알림", "서버 IP 주소를 입력해주세요.");
      return;
    }
    navigation.navigate(HomeRoutes.LOADING, { socketHost: socketHost.trim() });
  };

  return (
    <View style={styles.container}>
      {/* 헤더: 로고 + Factorial 텍스트 */}
      <View style={styles.header}>
        <SvgXml xml={logoSvg} width={38} height={38} />
        <Text style={styles.title}>Factorial</Text>
      </View>

      {/* IP 입력 영역 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>서버 IP 주소</Text>
        <TextInput
          style={styles.input}
          value={socketHost}
          onChangeText={handleHostChange}
          placeholder="예: 192.168.50.1"
          placeholderTextColor={GRAY}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>시작하기</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate(HomeRoutes.LOG)}
        >
          <Text style={styles.buttonText}>로그 확인</Text>
        </Pressable>
      </View>

      {/* 태그라인 */}
      <Text style={styles.tagline}>Make your safety factorial !</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    position: "absolute",
    top: 60,
    left: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY.DARK,
    marginLeft: 12,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 40,
    marginTop: 100,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY.DARK,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: GRAY,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: PRIMARY.DARK,
    backgroundColor: WHITE,
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  },
  button: {
    width: 251,
    height: 95,
    backgroundColor: WHITE,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: "700",
    color: PRIMARY.DARK,
    textAlign: "center",
  },
  tagline: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
  },
});
