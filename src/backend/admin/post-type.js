import React from "react";
import { createRoot } from "react-dom/client";
import MmdMetaBox from "./components/MmdMetaBox";
import "./admin-post-type.css";

document.addEventListener("DOMContentLoaded", () => {
	const mmdMetaBox = document.getElementById("mmd-post-metabox");
	if (mmdMetaBox) {
		const root = createRoot(mmdMetaBox);
		root.render(<MmdMetaBox mmdObj={mmdPostObj} />);
	}
});
