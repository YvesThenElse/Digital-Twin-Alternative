import { StrictMode } from "react";
// Le socle visuel. Il n'existait pas : le produit portait trois styles en
// ligne et des classes référencées nulle part, et rien ne le signalait —
// une suite verte assérant des attributs `data-*`.
import "./styles/socle.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
