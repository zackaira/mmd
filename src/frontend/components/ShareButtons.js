import React from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";

const ShareButtons = ({ routeUrl }) => {
	const openPopup = (url, title) => {
		const width = 600;
		const height = 400;
		const left = (window.innerWidth - width) / 2;
		const top = (window.innerHeight - height) / 2;
		window.open(
			url,
			title,
			`width=${width},height=${height},left=${left},top=${top}`
		);
	};

	return (
		<div className="mmd-share-btns">
			<button
				className="social-btn"
				onClick={() => {
					navigator.clipboard.writeText(routeUrl);
					toast.success(__("Route Saved to Clipboard!", "mmd"));
				}}
			>
				{__("Copy Route URL", "mmd")}
			</button>
			<button
				className="social-btn"
				onClick={() =>
					openPopup(
						`https://www.messenger.com/t/?link=${encodeURIComponent(routeUrl)}`,
						"Messenger Share"
					)
				}
			>
				{__("Messenger", "mmd")}
			</button>
			<button
				className="social-btn whatsapp"
				onClick={() =>
					openPopup(
						`https://wa.me/?text=${encodeURIComponent(routeUrl)}`,
						"WhatsApp Share"
					)
				}
			>
				{__("WhatsApp", "mmd")}
			</button>
			<button
				className="social-btn telegram"
				onClick={() =>
					openPopup(
						`https://t.me/share/url?url=${encodeURIComponent(routeUrl)}`,
						"Telegram Share"
					)
				}
			>
				{__("Telegram", "mmd")}
			</button>
			<button
				className="social-btn facebook"
				onClick={() =>
					openPopup(
						`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
							routeUrl
						)}`,
						"Facebook Share"
					)
				}
			>
				{__("Facebook", "mmd")}
			</button>
			<button
				className="social-btn xcom"
				onClick={() =>
					openPopup(
						`https://twitter.com/intent/tweet?url=${encodeURIComponent(
							routeUrl
						)}`,
						"X.com Share"
					)
				}
			>
				{__("X.com", "mmd")}
			</button>
			<button
				className="social-btn instagram"
				onClick={() =>
					alert(
						"Instagram does not support direct URL sharing from web. You might need to copy the URL manually."
					)
				}
			>
				{__("Instagram", "mmd")}
			</button>
			<button
				className="social-btn linkedin"
				onClick={() =>
					openPopup(
						`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
							routeUrl
						)}`,
						"LinkedIn Share"
					)
				}
			>
				{__("LinkedIn", "mmd")}
			</button>
		</div>
	);
};

export default ShareButtons;
