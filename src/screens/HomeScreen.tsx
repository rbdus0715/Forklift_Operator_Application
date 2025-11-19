import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SvgXml } from "react-native-svg";
import { colors } from "../color";

const logoSvg = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="19" fill="#015CAE"/>
<path d="M18.9982 28.48C18.1182 28.48 17.3682 28.18 16.7482 27.58C16.1482 26.98 15.8482 26.25 15.8482 25.39C15.8482 24.51 16.1482 23.77 16.7482 23.17C17.3682 22.57 18.1182 22.27 18.9982 22.27C19.8782 22.27 20.6182 22.57 21.2182 23.17C21.8382 23.77 22.1482 24.51 22.1482 25.39C22.1482 26.25 21.8382 26.98 21.2182 27.58C20.6182 28.18 19.8782 28.48 18.9982 28.48ZM18.9982 8.17C19.9982 8.17 20.7982 8.45 21.3982 9.01C22.0182 9.55 22.3282 10.34 22.3282 11.38C22.3282 11.92 22.2282 12.67 22.0282 13.63C21.8282 14.59 21.4082 15.96 20.7682 17.74L19.8982 20.11H18.0982L17.2282 17.74C16.5682 15.96 16.1382 14.59 15.9382 13.63C15.7582 12.67 15.6682 11.92 15.6682 11.38C15.6682 10.34 15.9682 9.55 16.5682 9.01C17.1682 8.45 17.9782 8.17 18.9982 8.17Z" fill="white"/>
</svg>`;

export const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* 헤더: 로고 + Factorial 텍스트 */}
      <View style={styles.header}>
        <SvgXml xml={logoSvg} width={38} height={38} />
        <Text style={styles.title}>Factorial</Text>
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>로그 확인</Text>
        </TouchableOpacity>
      </View>

      {/* 태그라인 */}
      <Text style={styles.tagline}>Make your safety factorial !</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.text,
    marginLeft: 12,
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  },
  button: {
    width: 251,
    height: 95,
    backgroundColor: colors.white,
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
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  tagline: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
  },
});

