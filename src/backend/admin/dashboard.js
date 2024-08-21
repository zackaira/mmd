import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./components/Dashboard";
import "./dashboard.css";

document.addEventListener("DOMContentLoaded", () => {
	const mmdDashboardBox = document.getElementById("mmd-dashboard-widget");
	if (mmdDashboardBox) {
		const root = createRoot(mmdDashboardBox);
		root.render(<Dashboard mmdObj={mmdDashObj} />);
	}
});
