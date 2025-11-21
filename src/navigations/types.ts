import { NavigationProp } from "@react-navigation/native";

export type HomeStackParamList = {
  Home: undefined;
  Log: undefined;
  Loading: undefined;
  Working: undefined;
};

export type HomeNavigation = NavigationProp<HomeStackParamList>;
