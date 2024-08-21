import React from "react";
import { __ } from "@wordpress/i18n";
import InputToggleSwitch from "./inputs/InputToggleSwitch";

const GiveFeedback = ({ mmdOptions, clickClose }) => {
	const question = document.querySelector(".ask-feedback");
	const happy = document.querySelector(".mmd-reply.happy");
	const sad = document.querySelector(".mmd-reply.sad");

	const handleYesClick = () => {
		question.classList.remove("show");
		sad.classList.remove("show");
		happy.classList.add("show");
		reset();
	};
	const handleNoClick = () => {
		question.classList.remove("show");
		happy.classList.remove("show");
		sad.classList.add("show");
		reset();
	};

	function reset() {
		setTimeout(() => {
			happy.classList.remove("show");
			sad.classList.remove("show");
			question.classList.add("show");
		}, 12000);
	}

	return (
		<React.Fragment>
			<div className="mmd-feedback">
				<div className="ask-feedback show">
					<b>{__("Quick question... ", "mmd")}</b>
					{__("Are you enjoying using the Linkt plugin?", "mmd")}
					<a onClick={handleYesClick}>{__("Yes", "mmd")}</a>
					<a onClick={handleNoClick}>{__("No", "mmd")}</a>
					<div className="mmd-feedback-dismiss">
						<InputToggleSwitch
							title="X"
							slug="global_disablerating"
							value={mmdOptions.disablerating}
							onChange={clickClose}
						/>
					</div>
				</div>
				<div className="mmd-reply happy">
					{__(
						"Great! Please help us with a 5 star review 🙏 It will really help users to gain trust in our product and help us grow.",
						"mmd"
					)}
					<a
						href="https://wordpress.org/support/plugin/mmd/reviews/?filter=5#new-post"
						target="_blank"
					>
						{__("Give 5 Stars :)", "mmd")}
					</a>
				</div>
				<div className="mmd-reply sad">
					{__(
						"Oh no! Did something break or not work as expected? Please contact me at z@ckaira.com so I can fix the issue and improve the plugin for you.",
						"mmd"
					)}
					<a href="mailto:z@ckaira.com" target="_blank">
						{__("Get In Contact", "mmd")}
					</a>
				</div>
			</div>
		</React.Fragment>
	);
};

export default GiveFeedback;
