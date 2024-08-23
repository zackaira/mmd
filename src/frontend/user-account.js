import React from "react";
import { createRoot } from "react-dom/client";
import "./user-account.css";
import AccountRoutes from "./components/AccountRoutes";
import ProfilePicture from "./components/ProfilePicture";

document.addEventListener("DOMContentLoaded", () => {
	const mmdAccRoutesRoot = document.getElementById("mmd-user-routes");

	if (mmdAccRoutesRoot) {
		const root = createRoot(mmdAccRoutesRoot);
		root.render(<AccountRoutes mmdObj={mmdAccountObj} />);
	}

	const mmdProfilePicRoot = document.getElementById("mmd-profile-picture");

	if (mmdProfilePicRoot) {
		const root = createRoot(mmdProfilePicRoot);
		root.render(<ProfilePicture mmdObj={mmdAccountObj} />);
	}
});
