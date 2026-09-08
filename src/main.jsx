import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ArcGISAuth from "./ArcGISAuth.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode><ArcGISAuth><App /></ArcGISAuth></StrictMode>,
);
