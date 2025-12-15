import { LogBox } from "react-native";
import Navigation from "./navigations/Navigation";

// 모바일에서 모든 로그 및 경고 메시지 숨기기
LogBox.ignoreAllLogs();

export const App = () => {
  return <Navigation />;
};

export default App;
