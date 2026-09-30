import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "@/AppRoutes";
import "./i18n/config"; // Import i18n config


export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
