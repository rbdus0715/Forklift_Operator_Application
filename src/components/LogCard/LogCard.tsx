import { StyleSheet, Text, View } from "react-native";
import { BLACK, GRAY, WHITE, RED } from "../../color";

export interface WarningLog {
  id: string;
  timestamp: string;
  distance: number;
  date: string;
  time: string;
}

interface LogCardProps {
  log: WarningLog;
}

const LogCard = ({ log }: LogCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.warningText}>⚠️ 작업자 경고</Text>
        <Text style={styles.distanceText}>거리: {log.distance.toFixed(2)}m</Text>
        <Text style={styles.dateText}>{log.date}</Text>
        <Text style={styles.timeText}>{log.time}</Text>
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
  dateText: {
    fontSize: 12,
    color: GRAY,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: GRAY,
  },
});

export default LogCard;
