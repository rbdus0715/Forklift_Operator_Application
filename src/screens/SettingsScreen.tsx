import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HomeNavigation } from "../navigations/types";
import { WHITE, BLACK, GRAY, PRIMARY } from "../color";
import { useFontSize, FontSize } from "../contexts/FontSizeContext";

const SettingsScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { fontSize, setFontSize } = useFontSize();
  const isLarge = fontSize === "large";

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };

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
        <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 설정 내용 */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isLarge && styles.sectionTitleLarge]}>폰트 크기</Text>
          <View style={styles.options}>
            <Pressable
              style={[
                styles.optionButton,
                fontSize === "normal" && styles.optionButtonActive,
              ]}
              onPress={() => handleFontSizeChange("normal")}
            >
              <Text
                style={[
                  styles.optionText,
                  fontSize === "normal" && styles.optionTextActive,
                  isLarge && styles.optionTextLarge,
                ]}
              >
                보통
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.optionButton,
                fontSize === "large" && styles.optionButtonActive,
              ]}
              onPress={() => handleFontSizeChange("large")}
            >
              <Text
                style={[
                  styles.optionText,
                  fontSize === "large" && styles.optionTextActive,
                  isLarge && styles.optionTextLarge,
                ]}
              >
                크게
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BLACK,
    marginBottom: 16,
  },
  options: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GRAY,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  optionButtonActive: {
    borderColor: PRIMARY.DEFAULT,
    backgroundColor: PRIMARY.DEFAULT,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: BLACK,
  },
  optionTextActive: {
    color: WHITE,
    fontWeight: "600",
  },
  backIconLarge: {
    fontSize: 30,
  },
  headerTitleLarge: {
    fontSize: 31,
  },
  sectionTitleLarge: {
    fontSize: 22,
  },
  optionTextLarge: {
    fontSize: 20,
  },
});

export default SettingsScreen;

