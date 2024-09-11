import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import apiFetch from "@wordpress/api-fetch";
import { __ } from "@wordpress/i18n";
import Loader from "../Loader";

const UsernameChecker = ({ apiUrl }) => {
	const [username, setUsername] = useState("");
	const [isAvailable, setIsAvailable] = useState(null);
	const [isChecking, setIsChecking] = useState(false);

	useEffect(() => {
		const usernameInput = document.getElementById("reg_username");
		if (usernameInput) {
			setUsername(usernameInput.value);
			usernameInput.addEventListener("input", handleUsernameChange);
		}

		return () => {
			if (usernameInput) {
				usernameInput.removeEventListener("input", handleUsernameChange);
			}
		};
	}, []);

	useEffect(() => {
		const checkUsername = async () => {
			if (username.length < 3) {
				setIsAvailable(null);
				return;
			}
			setIsChecking(true);
			try {
				const response = await apiFetch({
					path: `${apiUrl}mmd-api/v1/check-username/${username}`,
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				setIsAvailable(response.available);
			} catch (error) {
				setIsAvailable(null);
			}
			setIsChecking(false);
		};

		const debounceTimer = setTimeout(checkUsername, 300);
		return () => clearTimeout(debounceTimer);
	}, [username]);

	const handleUsernameChange = (e) => {
		setUsername(e.target.value);
	};

	const getBorderColor = () => {
		if (isChecking) return "transparent";
		if (isAvailable === null) return "transparent";
		return isAvailable ? "#20b126" : "#cd1616";
	};

	useEffect(() => {
		const usernameInput = document.getElementById("reg_username");
		if (usernameInput) {
			usernameInput.style.borderColor = getBorderColor();
		}
	}, [isChecking, isAvailable]);

	return (
		<div className="username-status">
			{isChecking && <Loader width={25} height={25} />}
			{!isChecking && isAvailable === false && (
				<span className="status not-available">
					{__("Username NOT Available", "mmd")}
				</span>
			)}
			{!isChecking && isAvailable === true && (
				<span className="status available">
					{__("Username Available", "mmd")}
				</span>
			)}
		</div>
	);
};

document.addEventListener("DOMContentLoaded", () => {
	const mmdRoot = document.getElementById("mmd-username-root");
	if (mmdRoot) {
		const root = createRoot(mmdRoot);
		root.render(<UsernameChecker apiUrl={mmdUCObj.apiUrl} />);
	}
});
