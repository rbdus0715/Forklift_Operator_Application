import { StyleSheet, Text, View } from "react-native";
import { BLACK, GRAY, WHITE } from "../../color";

const LogCard = () => {
    return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.forkliftText}>지게차-1</Text>
        <Text style={styles.userText}>user-1</Text>
      </View>
      <Text style={styles.speedText}>25km/h 운행</Text>
    </View>
    )
};

  const styles = StyleSheet.create({
    card: {
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 0.3,
        borderColor: GRAY,
        elevation: 3,
      },
      cardLeft: {
        flex: 1,
      },
      forkliftText: {
        fontSize: 16,
        fontWeight: "600",
        color: BLACK,
        marginBottom: 4,
      },
      userText: {
        fontSize: 14,
        color: GRAY,
      },
      speedText: {
        fontSize: 14,
        fontWeight: "500",
        color: BLACK,
      },
  });

export default LogCard;         