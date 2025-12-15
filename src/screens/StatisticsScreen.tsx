import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Platform, Modal, Dimensions } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeNavigation } from "../navigations/types";
import { WHITE, BLACK, GRAY } from "../color";
import { WarningLog } from "../components/LogCard/LogCard";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFontSize } from "../contexts/FontSizeContext";

const ALL_LOGS_KEY = "@all_logs"; // 모든 거리 데이터 로그
const WARNING_LOGS_KEY = "@warning_logs"; // 경고 로그
const OPERATING_SESSIONS_KEY = "@operating_sessions"; // 운행 세션 (시작/종료 시간)
const SPEED_VIOLATION_COUNT_KEY = "@speed_violation_count"; // 과속 횟수 (날짜별)
const screenWidth = Dimensions.get("window").width;

const StatisticsScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { fontSize } = useFontSize();
  const isLarge = fontSize === "large";
  const [logs, setLogs] = useState<WarningLog[]>([]);
  const [warningLogs, setWarningLogs] = useState<WarningLog[]>([]);
  const [operatingSessions, setOperatingSessions] = useState<Array<{ id: string; date: string; startTime: number; endTime: number | null }>>([]);
  const [speedViolations, setSpeedViolations] = useState<{ [date: string]: number }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  const loadLogs = async () => {
    try {
      // 모든 로그 불러오기
      const logsJson = await AsyncStorage.getItem(ALL_LOGS_KEY);
      if (logsJson) {
        const parsedLogs = JSON.parse(logsJson);
        console.log("통계 화면 - 불러온 로그 개수:", parsedLogs.length);
        // 최신순으로 정렬
        const sortedLogs = parsedLogs.sort((a: WarningLog, b: WarningLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedLogs);
        console.log("통계 화면 - 정렬된 로그 개수:", sortedLogs.length);
        if (sortedLogs.length > 0) {
          console.log("통계 화면 - 첫 번째 로그:", sortedLogs[0]);
          console.log("통계 화면 - 선택된 날짜:", selectedDate);
        }
      } else {
        console.log("통계 화면 - 저장된 로그 없음");
        setLogs([]);
      }

      // 경고 로그 불러오기
      const warningLogsJson = await AsyncStorage.getItem(WARNING_LOGS_KEY);
      if (warningLogsJson) {
        const parsedWarningLogs = JSON.parse(warningLogsJson);
        const sortedWarningLogs = parsedWarningLogs.sort((a: WarningLog, b: WarningLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setWarningLogs(sortedWarningLogs);
        console.log("통계 화면 - 경고 로그 개수:", sortedWarningLogs.length);
      } else {
        setWarningLogs([]);
      }

      // 운행 세션 불러오기
      const sessionsJson = await AsyncStorage.getItem(OPERATING_SESSIONS_KEY);
      if (sessionsJson) {
        const parsedSessions = JSON.parse(sessionsJson);
        setOperatingSessions(parsedSessions);
        console.log("통계 화면 - 운행 세션 개수:", parsedSessions.length);
      } else {
        setOperatingSessions([]);
      }

      // 과속 횟수 불러오기
      const violationsJson = await AsyncStorage.getItem(SPEED_VIOLATION_COUNT_KEY);
      if (violationsJson) {
        try {
          const parsed = JSON.parse(violationsJson);
          // 숫자로 저장된 기존 데이터인 경우 빈 객체로 초기화
          if (typeof parsed === "number") {
            setSpeedViolations({});
            console.log("통계 화면 - 기존 숫자 데이터를 객체로 변환");
          } else if (typeof parsed === "object" && parsed !== null) {
            setSpeedViolations(parsed);
            console.log("통계 화면 - 과속 횟수 데이터:", parsed);
          } else {
            setSpeedViolations({});
          }
        } catch (e) {
          console.error("통계 화면 - 과속 횟수 파싱 실패:", e);
          setSpeedViolations({});
        }
      } else {
        setSpeedViolations({});
      }
    } catch (error) {
      console.error("로그 불러오기 실패:", error);
      setLogs([]);
      setWarningLogs([]);
      setOperatingSessions([]);
      setSpeedViolations({});
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, []);

  // 선택된 날짜의 로그 필터링
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => log.date === selectedDate);
    console.log("통계 화면 - 필터링된 로그 개수:", filtered.length, "선택된 날짜:", selectedDate);
    if (filtered.length > 0) {
      console.log("통계 화면 - 필터링된 첫 번째 로그:", filtered[0]);
    }
    return filtered;
  }, [logs, selectedDate]);

  // 시간대별 속도 데이터 계산 (시간대별 평균 속도 또는 빈도)
  const chartData = useMemo(() => {
    // 작업 시간: 9시 ~ 18시 (9시간) - 고정
    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 18;
    
    // 작업 시간대만 1시간 단위로 나눔
    const hourlyData: { [key: number]: number[] } = {};
    
    filteredLogs.forEach((log) => {
      try {
        const timeParts = log.time.split(":");
        if (timeParts.length < 2) {
          console.warn("잘못된 시간 형식:", log.time);
          return;
        }
        
        const hour = parseInt(timeParts[0], 10);
        
        // 유효한 시간인지 확인 (0~23시)
        if (isNaN(hour) || hour < 0 || hour >= 24) {
          console.warn("유효하지 않은 시간:", log.time);
          return;
        }
        
        // 작업 시간대(9시~18시)만 처리
        if (hour >= WORK_START_HOUR && hour < WORK_END_HOUR) {
          if (!hourlyData[hour]) {
            hourlyData[hour] = [];
          }
          
          // 시간대별 거리 값 수집
          hourlyData[hour].push(log.distance);
        }
      } catch (error) {
        console.error("시간 파싱 에러:", error, log);
      }
    });

    // 각 시간대의 평균 거리 계산 (작업 시간대만 - 9시~18시 고정)
    const labels: string[] = [];
    const data: number[] = [];
    
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      labels.push(`${hour}시`);
      if (hourlyData[hour] && hourlyData[hour].length > 0) {
        const avgDistance = hourlyData[hour].reduce((sum, val) => sum + val, 0) / hourlyData[hour].length;
        data.push(Number(avgDistance.toFixed(2)));
      } else {
        data.push(0);
      }
    }

    return { labels, data };
  }, [filteredLogs]);

  // 날짜 선택 핸들러
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    
    if (date) {
      setDatePickerValue(date);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      setSelectedDate(dateString);
      
      // iOS에서는 완료 버튼을 눌러야 적용되므로 여기서는 상태만 업데이트
      if (Platform.OS === "ios" && event.type === "set") {
        setShowDatePicker(false);
      }
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  // iOS 완료 버튼 핸들러
  const handleDateConfirm = () => {
    const dateString = `${datePickerValue.getFullYear()}-${String(datePickerValue.getMonth() + 1).padStart(2, "0")}-${String(datePickerValue.getDate()).padStart(2, "0")}`;
    setSelectedDate(dateString);
    setShowDatePicker(false);
  };

  // 날짜 선택 버튼 클릭
  const openDatePicker = () => {
    // 현재 선택된 날짜로 초기화
    const [year, month, day] = selectedDate.split("-").map(Number);
    setDatePickerValue(new Date(year, month - 1, day));
    setShowDatePicker(true);
  };

  // 화면이 포커스될 때마다 로그 불러오기
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  // 오늘 날짜 계산
  const todayDate = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  // 오늘 날짜의 경고 로그 필터링
  const todayWarningLogs = useMemo(() => {
    return warningLogs.filter((log) => log.date === todayDate);
  }, [warningLogs, todayDate]);

  // 오늘 과속 횟수
  const speedViolationCount = useMemo(() => {
    return speedViolations[todayDate] || 0;
  }, [speedViolations, todayDate]);

  // 선택된 날짜의 3m 이내 경고 횟수 (경고 로그에서 가져오기)
  const warningCount = useMemo(() => {
    return warningLogs.filter((log) => log.date === selectedDate).length;
  }, [warningLogs, selectedDate]);

  // 선택된 날짜의 운행 시간 계산 (운행 세션 기반)
  const operatingTime = useMemo(() => {
    // 선택된 날짜의 완료된 세션만 필터링
    const completedSessions = operatingSessions.filter(
      (session) => session.date === selectedDate && session.endTime !== null
    );

    // 모든 세션의 운행시간 합산
    const totalMs = completedSessions.reduce((sum, session) => {
      if (session.endTime !== null) {
        return sum + (session.endTime - session.startTime);
      }
      return sum;
    }, 0);

    // 밀리초를 시:분:초로 변환
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [operatingSessions, selectedDate]);

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
        <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>통계 확인</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* 날짜 선택 영역 */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dateLabel, isLarge && styles.dateLabelLarge]}>날짜 선택:</Text>
        <Pressable style={styles.dateButton} onPress={openDatePicker}>
          <Text style={[styles.dateText, isLarge && styles.dateTextLarge]}>{selectedDate}</Text>
          <Text style={[styles.dateIcon, isLarge && styles.dateIconLarge]}>📅</Text>
        </Pressable>
      </View>

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable
                      onPress={() => setShowDatePicker(false)}
                      style={styles.modalCancelButton}
                    >
                      <Text style={[styles.modalCancelText, isLarge && styles.modalCancelTextLarge]}>취소</Text>
                    </Pressable>
                    <Text style={[styles.modalTitle, isLarge && styles.modalTitleLarge]}>날짜 선택</Text>
                    <Pressable
                      onPress={handleDateConfirm}
                      style={styles.modalConfirmButton}
                    >
                      <Text style={[styles.modalConfirmText, isLarge && styles.modalConfirmTextLarge]}>완료</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={datePickerValue}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </>
      )}

      {/* 차트 영역 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, isLarge && styles.chartTitleLarge]}>작업 시간에 따른 거리 그래프</Text>
          <Text style={[styles.chartSubtitle, isLarge && styles.chartSubtitleLarge]}>
            {selectedDate} ({filteredLogs.length}건)
          </Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  data: chartData.data,
                  color: (opacity = 1) => `rgba(1, 92, 174, ${opacity})`, // PRIMARY 색상
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 48} // 화면 너비에 맞춤
            height={220}
            yAxisLabel=""
            yAxisSuffix=" m"
            chartConfig={{
              backgroundColor: WHITE,
              backgroundGradientFrom: WHITE,
              backgroundGradientTo: WHITE,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(1, 92, 174, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#015CAE",
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: GRAY,
                strokeWidth: 1,
              },
              propsForLabels: {
                fontSize: 11,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          {/* 통계 박스 카드 */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={[styles.statLabel, isLarge && styles.statLabelLarge]}>오늘 과속 횟수</Text>
              <Text style={[styles.statValue, isLarge && styles.statValueLarge]}>{speedViolationCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statLabel, isLarge && styles.statLabelLarge]}>3m 이내 경고</Text>
              <Text style={[styles.statValue, isLarge && styles.statValueLarge]}>{warningCount}</Text>
            </View>
          </View>
          
          {/* 운행 시간 카드 */}
          <View style={styles.operatingTimeContainer}>
            <View style={styles.operatingTimeCard}>
              <Text style={[styles.statLabel, isLarge && styles.statLabelLarge]}>운행 시간</Text>
              <Text style={[styles.operatingTimeValue, isLarge && styles.operatingTimeValueLarge]}>{operatingTime}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  placeholderButton: {
    width: 40,
    height: 40,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BLACK,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: BLACK,
  },
  dateIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  chartContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GRAY,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: BLACK,
  },
  operatingTimeContainer: {
    width: "100%",
    marginTop: 12,
  },
  operatingTimeCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  operatingTimeValue: {
    fontSize: 32,
    fontWeight: "700",
    color: BLACK,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: BLACK,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: GRAY,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BLACK,
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#015CAE",
  },
  datePicker: {
    width: "100%",
    height: 200,
  },
  backIconLarge: {
    fontSize: 30,
  },
  headerTitleLarge: {
    fontSize: 31,
  },
  dateLabelLarge: {
    fontSize: 20,
  },
  dateTextLarge: {
    fontSize: 20,
  },
  dateIconLarge: {
    fontSize: 22,
  },
  chartTitleLarge: {
    fontSize: 22,
  },
  chartSubtitleLarge: {
    fontSize: 18,
  },
  statLabelLarge: {
    fontSize: 18,
  },
  statValueLarge: {
    fontSize: 40,
  },
  operatingTimeValueLarge: {
    fontSize: 40,
  },
  emptyTextLarge: {
    fontSize: 20,
  },
  modalCancelTextLarge: {
    fontSize: 20,
  },
  modalTitleLarge: {
    fontSize: 22,
  },
  modalConfirmTextLarge: {
    fontSize: 20,
  },
});

export default StatisticsScreen;

