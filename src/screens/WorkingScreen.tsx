import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, BackHandler, Dimensions } from "react-native";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { HomeRoutes } from "../navigations/routes";
import { HomeNavigation } from "../navigations/types";
import { BLACK, WHITE, GRAY, RED } from "../color";
import Socket from "react-native-tcp-socket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WarningLog } from "../components/LogCard/LogCard";
import { useFontSize } from "../contexts/FontSizeContext";

const BORDER_WIDTH = 0.2;
const SOCKET_PORT = 9000;
const WARNING_LOGS_KEY = "@warning_logs";
const ALL_LOGS_KEY = "@all_logs"; // 모든 거리 데이터 로그
const WARNING_THRESHOLD_DISTANCE = 3; // 3미터
const WARNING_MIN_DURATION = 1000; // 1초 (밀리초)
const LOG_INTERVAL = 1000; // 모든 로그 저장 간격 (1초)

// 원의 반지름 (픽셀)
const CIRCLE3_RADIUS = 300; // 중간 원 (3m) - 범위 확장
const MAX_DISTANCE = 5; // 최대 표시 거리 (미터)
const CENTER_OFFSET_Y = 180; // 중심점을 아래로 이동 (더 아래로)

// 화면 크기 가져오기
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const RADAR_CENTER_Y = SCREEN_HEIGHT * 0.425 + CENTER_OFFSET_Y; // 레이더 컨테이너의 중심 Y 위치

export const WorkingScreen = () => {
  const navigation = useNavigation<HomeNavigation>();
  const route = useRoute();
  const { fontSize } = useFontSize();
  const isLarge = fontSize === "large";
  const socketRef = useRef<Socket.Socket | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const failureHandledRef = useRef<boolean>(false);
  const alertShowingRef = useRef<boolean>(false);
  const alertRef = useRef<boolean>(false); // 알람 중복 방지
  const [rD, setRD] = useState<number | null>(null);
  const [filteredRD, setFilteredRD] = useState<number | null>(null);
  const [pedestrianAngle, setPedestrianAngle] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState<boolean>(false);
  const [isRedBackground, setIsRedBackground] = useState<boolean>(false);
  
  // 칼만 필터 상태
  const kalmanStateRef = useRef<{
    estimate: number;
    uncertainty: number;
  } | null>(null);

  // 3m 이내 경고 로깅 관련 상태
  const warningEnterTimeRef = useRef<number | null>(null); // 3m 이내 진입 시간
  const isLoggingRef = useRef<boolean>(false); // 로그 저장 중 플래그 (중복 방지)
  
  // 모든 로그 저장 관련 상태
  const lastLogTimeRef = useRef<number>(0); // 마지막 로그 저장 시간
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null); // 로그 저장 인터벌

  // 로깅 상태 리셋 함수
  const resetWarningLogging = () => {
    warningEnterTimeRef.current = null;
    isLoggingRef.current = false;
  };

  useEffect(() => {
    const socketHost = (route.params as { socketHost: string })?.socketHost || "192.168.50.1";
    
    // TCP 소켓 연결
    console.log("소켓 연결 시도:", `${socketHost}:${SOCKET_PORT}`);
    console.log("연결 시작 시간:", new Date().toISOString());
    
    // 상태 리셋
    failureHandledRef.current = false;
    alertShowingRef.current = false;
    isConnectedRef.current = false;

    const handleConnectionFailure = () => {
      if (!failureHandledRef.current && !alertShowingRef.current && !alertRef.current) {
        failureHandledRef.current = true;
        alertShowingRef.current = true;
        alertRef.current = true;
        isConnectedRef.current = false;
        
        // 소켓 리스너 제거 및 종료
        if (socketRef.current) {
          socketRef.current.removeAllListeners("data");
          socketRef.current.removeAllListeners("error");
          socketRef.current.removeAllListeners("close");
          socketRef.current.destroy();
          socketRef.current = null;
        }
        
        // 로깅 상태 리셋
        resetWarningLogging();
        
        // 알람 표시
        Alert.alert("서버 연결 실패했습니다", "서버와의 연결이 끊어졌습니다.", [
          {
            text: "확인",
            onPress: () => {
              alertShowingRef.current = false;
              alertRef.current = false;
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: HomeRoutes.HOME }],
                })
              );
            },
          },
        ]);
      }
    };

    const handleDisconnection = () => {
      if (isConnectedRef.current && !failureHandledRef.current && !alertShowingRef.current && !alertRef.current) {
        // 연결 후 끊어진 경우
        failureHandledRef.current = true;
        alertShowingRef.current = true;
        alertRef.current = true;
        isConnectedRef.current = false;
        
        // 소켓 리스너 제거 및 종료
        if (socketRef.current) {
          socketRef.current.removeAllListeners("data");
          socketRef.current.removeAllListeners("error");
          socketRef.current.removeAllListeners("close");
          socketRef.current.destroy();
          socketRef.current = null;
        }
        
        // 로깅 상태 리셋
        resetWarningLogging();
        
        // 알람 표시
        Alert.alert("연결이 끊어졌습니다", "서버와의 연결이 끊어졌습니다. 홈으로 돌아갑니다.", [
          {
            text: "확인",
            onPress: () => {
              alertShowingRef.current = false;
              alertRef.current = false;
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: HomeRoutes.HOME }],
                })
              );
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

      // 칼만 필터 함수
      const kalmanFilter = (measurement: number): number => {
        const Q = 0.01; // 프로세스 노이즈 (작을수록 신뢰)
        const R = 0.1; // 측정 노이즈 (작을수록 측정값 신뢰)
        
        if (kalmanStateRef.current === null) {
          // 초기화
          kalmanStateRef.current = {
            estimate: measurement,
            uncertainty: 1.0,
          };
          return measurement;
        }
        
        const { estimate, uncertainty } = kalmanStateRef.current;
        
        // 예측 단계
        const predictedEstimate = estimate;
        const predictedUncertainty = uncertainty + Q;
        
        // 업데이트 단계
        const kalmanGain = predictedUncertainty / (predictedUncertainty + R);
        const newEstimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
        const newUncertainty = (1 - kalmanGain) * predictedUncertainty;
        
        // 상태 업데이트
        kalmanStateRef.current = {
          estimate: newEstimate,
          uncertainty: newUncertainty,
        };
        
        return newEstimate;
      };

      const handleData = (data: string | Buffer) => {
        // 연결 상태 확인
        if (!isConnectedRef.current) {
          return;
        }
        
        const dataString = data.toString();
        console.log("받은 데이터:", dataString);
        // JSON 데이터인 경우 파싱 시도
        try {
          const parsed = JSON.parse(dataString);
          console.log("파싱된 데이터:", parsed);
          // rD 값 추출 (rD, rD값, distance 등 다양한 필드명 가능)
          const distance = parsed.rD || parsed.rD값 || parsed.distance || parsed.rD_value;
          if (typeof distance === "number" && !isNaN(distance) && distance >= 0) {
            setRD(distance);
            // 칼만 필터 적용
            const filtered = kalmanFilter(distance);
            setFilteredRD(filtered);
            
            // 모든 로그 저장 (1초마다)
            const now = Date.now();
            if (now - lastLogTimeRef.current >= LOG_INTERVAL) {
              lastLogTimeRef.current = now;
              saveAllLog(filtered).catch((error) => {
                console.error("전체 로그 저장 실패:", error);
              });
            }
          }
        } catch (e) {
          // JSON이 아니면 그대로 출력
        }
      };

      const handleError = (error: Error) => {
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
      };

      const handleClose = () => {
        console.log("소켓 연결 종료");
        console.log("종료 시간:", new Date().toISOString());
        
        // 연결 상태를 즉시 false로 설정
        isConnectedRef.current = false;
        
        // 로깅 상태 리셋
        resetWarningLogging();
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        // 연결 성공하지 않은 경우 실패 처리
        if (!isConnectedRef.current && !failureHandledRef.current && !alertShowingRef.current) {
          setTimeout(() => {
            handleConnectionFailure();
          }, 100);
        } else if (!failureHandledRef.current && !alertShowingRef.current) {
          // 연결 후 끊어진 경우
          handleDisconnection();
        }
      };

      socket.on("data", handleData);
      socket.on("error", handleError);
      socket.on("close", handleClose);

      socketRef.current = socket;

      // 컴포넌트 언마운트 시 연결 종료
      return () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (socketRef.current) {
          console.log("컴포넌트 언마운트 - 소켓 연결 종료");
          // 모든 리스너 제거
          socketRef.current.removeAllListeners("data");
          socketRef.current.removeAllListeners("error");
          socketRef.current.removeAllListeners("close");
          // 소켓 종료
          socketRef.current.destroy();
          socketRef.current = null;
        }
        // 리셋
        alertShowingRef.current = false;
        failureHandledRef.current = false;
        isConnectedRef.current = false;
        alertRef.current = false;
        kalmanStateRef.current = null;
        // 경고 로깅 상태 리셋
        resetWarningLogging();
        // 로그 인터벌 정리
        if (logIntervalRef.current) {
          clearInterval(logIntervalRef.current);
          logIntervalRef.current = null;
        }
        lastLogTimeRef.current = 0;
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
          // 연결 상태 먼저 false로 설정
          isConnectedRef.current = false;
          
          // 소켓 연결 완전히 종료
          if (socketRef.current) {
            console.log("종료 확인 - 소켓 연결 종료");
            // 모든 리스너 제거
            socketRef.current.removeAllListeners("data");
            socketRef.current.removeAllListeners("error");
            socketRef.current.removeAllListeners("close");
            // 소켓 종료
            socketRef.current.destroy();
            socketRef.current = null;
          }
          // 타임아웃 클리어
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          // 상태 리셋
          alertShowingRef.current = false;
          failureHandledRef.current = false;
          alertRef.current = false;
          kalmanStateRef.current = null;
          // 경고 로깅 상태 리셋
          resetWarningLogging();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: HomeRoutes.HOME }],
            })
          );
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

  // 거리가 3미터 이내인지 확인 및 로깅 처리 (필터링된 값 사용)
  useEffect(() => {
    // 연결이 끊겨있으면 로깅 중단 및 상태 리셋
    if (!isConnectedRef.current) {
      setIsWarning(false);
      resetWarningLogging();
      return;
    }

    const isWithin3m = filteredRD !== null && filteredRD <= WARNING_THRESHOLD_DISTANCE;
    setIsWarning(isWithin3m);

    if (isWithin3m) {
      // 3m 이내 진입 (연결 상태 확인)
      if (!isConnectedRef.current) {
        resetWarningLogging();
        return;
      }

      if (warningEnterTimeRef.current === null) {
        // 처음 진입한 경우
        warningEnterTimeRef.current = Date.now();
      }
    } else {
      // 3m 이내에서 벗어남
      if (warningEnterTimeRef.current !== null && isConnectedRef.current && !isLoggingRef.current) {
        // 진입 시간부터 벗어난 시간까지의 총 지속 시간 계산
        const totalDuration = (Date.now() - warningEnterTimeRef.current) / 1000; // 초 단위
        
        // 1초 이상 지속되었던 경우에만 로그 저장
        if (totalDuration >= WARNING_MIN_DURATION / 1000) {
          const exitDistance = filteredRD !== null ? filteredRD : rD;
          
          if (exitDistance !== null) {
            // 로그 저장 중 플래그 설정 (중복 방지)
            isLoggingRef.current = true;
            
            // 1초 이상 지속된 경우, 1초 이후부터의 지속 시간 계산
            const duration = totalDuration - (WARNING_MIN_DURATION / 1000);
            saveWarningLog(exitDistance, duration).finally(() => {
              // 로그 저장 완료 후 상태 초기화
              resetWarningLogging();
            });
            return; // 로그 저장 중이므로 여기서 종료
          }
        }
      }
      
      // 상태 초기화 (로그 저장하지 않은 경우)
      if (!isLoggingRef.current) {
        resetWarningLogging();
      }
    }

  }, [filteredRD, rD]);

  // 모든 거리 데이터 로그 저장 함수
  const saveAllLog = async (distance: number): Promise<void> => {
    try {
      const now = new Date();
      const timestamp = now.toISOString();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const newLog: WarningLog = {
        id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        distance,
        date,
        time,
        // duration은 없음 (모든 로그는 순간 측정값)
      };

      // 기존 로그 불러오기
      const logsJson = await AsyncStorage.getItem(ALL_LOGS_KEY);
      const logs: WarningLog[] = logsJson ? JSON.parse(logsJson) : [];
      
      // 새 로그 추가
      logs.push(newLog);
      
      // 최대 10000개까지만 저장 (메모리 관리)
      if (logs.length > 10000) {
        logs.splice(0, logs.length - 10000);
      }
      
      // 저장
      await AsyncStorage.setItem(ALL_LOGS_KEY, JSON.stringify(logs));
      console.log("전체 로그 저장 성공:", { distance, date, time, totalLogs: logs.length });
    } catch (error) {
      console.error("전체 로그 저장 실패:", error);
    }
  };

  // 경고 로그 저장 함수
  const saveWarningLog = async (distance: number, duration: number): Promise<void> => {
    try {
      // duration이 0보다 작거나 같으면 저장하지 않음
      if (duration <= 0) {
        console.log("경고 로그 저장 스킵: duration이 0 이하", { distance, duration });
        return;
      }

      const now = new Date();
      const timestamp = now.toISOString();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const newLog: WarningLog = {
        id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        distance,
        date,
        time,
        duration,
      };

      // 기존 로그 불러오기
      const logsJson = await AsyncStorage.getItem(WARNING_LOGS_KEY);
      const logs: WarningLog[] = logsJson ? JSON.parse(logsJson) : [];
      
      // 새 로그 추가
      logs.push(newLog);
      
      // 저장
      await AsyncStorage.setItem(WARNING_LOGS_KEY, JSON.stringify(logs));
      
      console.log("경고 로그 저장 성공:", { distance, duration: duration.toFixed(2), date, time, totalLogs: logs.length });
    } catch (error) {
      console.error("경고 로그 저장 실패:", error);
      throw error; // 에러를 다시 throw하여 finally에서 처리할 수 있도록
    }
  };

  // 경고 상태일 때 배경색 깜빡이기 (1초 단위)
  useEffect(() => {
    if (!isWarning) {
      setIsRedBackground(false);
      return;
    }

    const interval = setInterval(() => {
      setIsRedBackground((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarning]);

  // 보행자 위치 계산 - 정중앙 앞에서 나타남 (필터링된 값 사용)
  const getPedestrianPosition = () => {
    const distance = filteredRD !== null ? filteredRD : rD;
    if (distance === null || distance > MAX_DISTANCE) {
      return null;
    }

    // 5미터일 때 위쪽, 가까워질수록 아래로, 중앙으로 이동
    // 거리에 따라 y 위치 계산 (5m -> 위쪽, 0m -> 중앙)
    const maxY = -CIRCLE3_RADIUS * 1.5; // 5미터일 때 위쪽 위치
    const minY = 0; // 0미터일 때 중앙
    
    // 거리가 멀수록 위쪽, 가까울수록 아래쪽
    const y = maxY + ((MAX_DISTANCE - distance) / MAX_DISTANCE) * (minY - maxY);
    
    // x는 항상 0 (정중앙)
    const x = 0;
    
    return { x, y, distance };
  };

  const pedestrianPosition = getPedestrianPosition();

  // 동적 스타일 생성
  const radarCenterStyle = {
    top: RADAR_CENTER_Y,
  };

  return (
    <View style={[styles.container, isRedBackground && styles.redBackground]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleExit}>
          <Text style={[styles.backIcon, isLarge && styles.backIconLarge]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, isLarge && styles.headerTitleLarge]}>작업 중</Text>
        <Pressable style={styles.placeholderButton}>
          <Text style={styles.placeholderIcon}></Text>
        </Pressable>
      </View>

      {/* 경고 메시지 (3미터 이내일 때) */}
      {isWarning && (
        <View style={styles.warningContainer}>
          <Text style={[styles.warningText, isLarge && styles.warningTextLarge]}>작업자</Text>
          <Text style={[styles.warningText, isLarge && styles.warningTextLarge]}>3미터 이내</Text>
        </View>
      )}

      {/* 레이더 스타일 디스플레이 */}
      <View style={styles.radarContainer}>
        {/* 동심원들 */}
        <View style={[styles.circle1, radarCenterStyle]} />
        <View style={[styles.circle2, radarCenterStyle]} />
        <View style={[styles.circle3, radarCenterStyle]} />
        <View style={[styles.circle4, radarCenterStyle]} />

        {/* 수평선 */}
        <View style={[styles.horizontalLine, radarCenterStyle]} />

        {/* 중앙 원 */}
        <View style={[styles.centerCircle, radarCenterStyle]} />

        {/* 거리 표시 */}
        <Text style={[styles.distanceText, isLarge && styles.distanceTextLarge, { top: RADAR_CENTER_Y - 200 }]}>3m</Text>

        {/* 보행자 마커 */}
        {pedestrianPosition && (
          <View
            style={[
              styles.pedestrianMarker,
              radarCenterStyle,
              {
                transform: [
                  { translateX: pedestrianPosition.x },
                  { translateY: pedestrianPosition.y },
                ],
              },
            ]}
          >
            <View style={styles.pedestrianIcon}>
              <Text style={[styles.pedestrianIconText, isLarge && styles.pedestrianIconTextLarge]}>👤</Text>
            </View>
            <Text style={[styles.pedestrianDistance, isLarge && styles.pedestrianDistanceLarge]}>
              {pedestrianPosition.distance.toFixed(1)}m
            </Text>
          </View>
        )}
      </View>

      {/* 종료 버튼 */}
      <Pressable style={styles.endButton} onPress={handleExit}>
        <Text style={[styles.endButtonText, isLarge && styles.endButtonTextLarge]}>종료</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  redBackground: {
    backgroundColor: RED,
  },
  warningContainer: {
    position: "absolute",
    top: 120, // 상단에 배치
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  warningText: {
    fontSize: 48,
    fontWeight: "900",
    color: WHITE,
    textAlign: "center",
    marginVertical: 8,
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
    paddingTop: CENTER_OFFSET_Y, // 중심점을 아래로 이동
  },
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
    left: "50%",
    marginLeft: -100,
    marginTop: -100,
  },
  circle2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: BORDER_WIDTH,
    borderColor: "#FFA500", // 3m 원 - 주황색
    left: "50%",
    marginLeft: -200,
    marginTop: -200,
  },
  circle3: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
    left: "50%",
    marginLeft: -300,
    marginTop: -300,
  },
  circle4: {
    position: "absolute",
    width: 800,
    height: 800,
    borderRadius: 400,
    borderWidth: BORDER_WIDTH,
    borderColor: GRAY,
    left: "50%",
    marginLeft: -400,
    marginTop: -400,
  },
  horizontalLine: {
    position: "absolute",
    width: "100%",
    height: BORDER_WIDTH,
    backgroundColor: GRAY,
    left: 0,
  },
  centerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: WHITE,
    position: "absolute",
    left: "50%",
    marginLeft: -10,
    marginTop: -10,
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
  pedestrianMarker: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    left: "50%",
    marginLeft: -25,
    marginTop: -25,
  },
  pedestrianIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
  },
  pedestrianIconText: {
    fontSize: 24,
  },
  pedestrianDistance: {
    position: "absolute",
    top: -20,
    color: RED,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: BLACK,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
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
  backIconLarge: {
    fontSize: 30,
  },
  headerTitleLarge: {
    fontSize: 31,
  },
  warningTextLarge: {
    fontSize: 60,
  },
  distanceTextLarge: {
    fontSize: 20,
  },
  pedestrianIconTextLarge: {
    fontSize: 30,
  },
  pedestrianDistanceLarge: {
    fontSize: 16,
  },
  endButtonTextLarge: {
    fontSize: 22,
  },
});
