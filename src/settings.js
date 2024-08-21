/*
 * Site Chat Admin / Settings Page JS
 */
import React from "react";
import { createRoot } from "react-dom/client";
import Settings from "./backend/Settings";
import "./backend/settings.css";

document.addEventListener("DOMContentLoaded", function () {
	const mmdObj = mmdSetObj;
	const element = document.getElementById("mmd-root");

	if (element) {
		const root = createRoot(element);
		root.render(<Settings mmdObj={mmdObj} />);
	}
});
