import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeRoutes } from "./routes";
import { HomeScreen } from "../screens/HomeScreen";
import LogScreen from "../screens/LogScreen";
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
    </Stack.Navigator>
  );
};

export default HomeStack;
