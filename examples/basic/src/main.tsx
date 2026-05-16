import React from "react";
import { createRoot } from "react-dom/client";
import { GalaxyGraph } from "@galaxy-graph/core";
import "@galaxy-graph/core/style.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GalaxyGraph />
  </React.StrictMode>
);
