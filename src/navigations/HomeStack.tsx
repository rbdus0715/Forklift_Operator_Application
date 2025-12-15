import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeRoutes } from "./routes";
import { HomeScreen } from "../screens/HomeScreen";
import LogScreen from "../screens/LogScreen";
import StatisticsScreen from "../screens/StatisticsScreen";
import { LoadingScreen } from "../screens/LoadingScreen";
import { WorkingScreen } from "../screens/WorkingScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { WHITE } from "../color";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: WHITE },
        headerShown: false,
      }}
    >
      <Stack.Screen name={HomeRoutes.HOME} component={HomeScreen} />
      <Stack.Screen name={HomeRoutes.LOG} component={LogScreen} />
      <Stack.Screen name={HomeRoutes.STATISTICS} component={StatisticsScreen} />
      <Stack.Screen name={HomeRoutes.LOADING} component={LoadingScreen} />
      <Stack.Screen name={HomeRoutes.WORKING} component={WorkingScreen} />
      <Stack.Screen name={HomeRoutes.SETTINGS} component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
