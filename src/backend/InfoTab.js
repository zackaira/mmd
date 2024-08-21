import React from "react";
import { __ } from "@wordpress/i18n";

const InfoTab = ({ adminUrl, isPro }) => {
	// const wcActive = Boolean(mmdObj.wcActive);
	// const isPremium = props.isPro ? props.isPro : "";
	// const upgradeUrl = props.upgrade ? props.upgrade : "";

	// const handleInputChange = (e) => {
	// 	licenseKeyChange(e);
	// };

	return (
		<React.Fragment>
			<div className="mmdInfoTab">
				<div className="mmd-header addspace">
					<h3 className="mmd-title">{__("Welcome to Linkt!", "mmd")}</h3>
					<p>
						{__(
							"Linkt is designed to be intuitive, with helpful hints provided throughout the settings. For a more comprehensive understanding, you can also watch this video tutorial on how the Linkt plugin works. Enjoy!",
							"mmd"
						)}
					</p>

					<a
						href="https://zackaira.com/wordpress-plugins/mmd-url-tracking-wordpress-plugin/"
						target="_blank"
						className="mmd-button"
					>
						{__("Visit the Plugin Page", "mmd")}
					</a>

					{!isPro && (
						<a
							href="https://zackaira.com/wordpress-plugins/mmd-url-tracking-wordpress-plugin/#purchase"
							target="_blank"
							className="mmd-button primary"
						>
							{__("Purchase Linkt Pro", "mmd")}
						</a>
					)}
				</div>

				<div className="mmd-video addspace mmd-hide">
					<h3 className="mmd-title">
						{__("Watch our video on using the Linkt plugin", "mmd")}
					</h3>
					{/* <p>
						{__(
							"Linkt is designed to be intuitive, with helpful hints provided throughout the settings. For a more comprehensive understanding, you can also watch this video tutorial on how the Linkt plugin works. Enjoy!",
							"mmd"
						)}
					</p> */}
					<a
						href="https://www.youtube.com/watch?v=4fCIDCcDgaU"
						target="_blank"
						className="mmd-button primary"
					>
						{__("Watch Linkt Video", "mmd")}
					</a>
				</div>

				<div className="mmd-help">
					<h4 className="mmd-title">
						{__("Support & Documentation", "mmd")}
					</h4>

					<p>
						{__(
							"Please watch the video on setting up and using Linkt, or contact me if you need help with anything regarding the plugin.",
							"mmd"
						)}
					</p>

					<a
						href="https://zackaira.com/wordpress-plugins/mmd-url-tracking-wordpress-plugin/#faqs"
						target="_blank"
						className="mmd-button"
					>
						{__("FAQ's", "mmd")}
					</a>
					<a
						href="mailto:z@ckaira.com"
						target="_blank"
						className="mmd-button"
					>
						{__("Email z@ckaira.com", "mmd")}
					</a>
				</div>
			</div>
		</React.Fragment>
	);
};

export default InfoTab;
