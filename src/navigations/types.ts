import { NavigationProp } from "@react-navigation/native";

export type HomeStackParamList = {
  Home: undefined;
  Log: undefined;
  Statistics: undefined;
  Loading: { socketHost: string };
  Working: { socketHost: string };
};

export type HomeNavigation = NavigationProp<HomeStackParamList>;
