import React from "react";
import { createRoot } from "react-dom/client";
import { __ } from "@wordpress/i18n";
import "./mmd.css";
import MapBox from "./components/MapBox";

document.addEventListener("DOMContentLoaded", () => {
	const mmdRoot = document.getElementById("mmd-root");

	if (mmdRoot) {
		const root = createRoot(mmdRoot);
		root.render(<MapBox mmdObj={mmdMapObj} />);
	}
});
