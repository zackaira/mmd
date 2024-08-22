import React from "react";
import { createRoot } from "react-dom/client";
import "./user-routes.css";
import AccountRoutes from "./components/AccountRoutes";

document.addEventListener("DOMContentLoaded", () => {
	const mmdAccRoutesRoot = document.getElementById("mmd-user-routes");

	if (mmdAccRoutesRoot) {
		const root = createRoot(mmdAccRoutesRoot);
		root.render(<AccountRoutes mmdObj={mmdRoutesObj} />);
	}
});
