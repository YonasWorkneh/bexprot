import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error:", { message, source, lineno, colno, error });
};

try {
  createRoot(document.getElementById("root")!).render(
    <App />
  );
} catch (error) {
  console.error("Render Error:", error);
  document.body.innerHTML = '<div style="color:red; padding:20px;"><h1>Critical Render Error</h1><pre>' + error + '</pre></div>';
}

