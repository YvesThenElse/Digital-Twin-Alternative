import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EtatDuService } from "./EtatDuService";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EtatDuService etat={undefined} />
  </StrictMode>,
);
