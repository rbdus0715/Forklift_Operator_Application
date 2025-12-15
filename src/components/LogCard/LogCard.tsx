import { StyleSheet, Text, View } from "react-native";
import { BLACK, GRAY, WHITE, RED } from "../../color";
import { useFontSize } from "../../contexts/FontSizeContext";

export interface WarningLog {
  id: string;
  timestamp: string;
  distance: number;
  date: string;
  time: string;
  duration?: number; // 지속 시간 (초)
}

interface LogCardProps {
  log: WarningLog;
}

const LogCard = ({ log }: LogCardProps) => {
  const { fontSize } = useFontSize();
  const isLarge = fontSize === "large";

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={[styles.warningText, isLarge && styles.warningTextLarge]}>
          3m 이내 경고
        </Text>
        <Text style={[styles.distanceText, isLarge && styles.distanceTextLarge]}>
          거리: {log.distance.toFixed(2)}m
        </Text>
        {log.duration !== undefined && (
          <Text style={[styles.durationText, isLarge && styles.durationTextLarge]}>
            지속 시간: {log.duration.toFixed(1)}초
          </Text>
        )}
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.dateText, isLarge && styles.dateTextLarge]}>
          {log.date}
        </Text>
        <Text style={[styles.timeText, isLarge && styles.timeTextLarge]}>
          {log.time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 0.3,
    borderColor: GRAY,
    elevation: 3,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  warningText: {
    fontSize: 16,
    fontWeight: "600",
    color: RED,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "500",
    color: BLACK,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
    color: BLACK,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: GRAY,
  },
  warningTextLarge: {
    fontSize: 20,
  },
  distanceTextLarge: {
    fontSize: 18,
  },
  durationTextLarge: {
    fontSize: 18,
  },
  dateTextLarge: {
    fontSize: 16,
  },
  timeTextLarge: {
    fontSize: 16,
  },
});

export default LogCard;
