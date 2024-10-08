import { __ } from "@wordpress/i18n";

/*
 * Convert Text to slug
 */
export const mmdConvertToSlug = (text, spacer = "_") => {
	return text
		.toLowerCase()
		.replace(/[^\w ]+/g, "")
		.replace(/ +/g, spacer);
};

/*
 * Setting for the Blocks settings displayed in the admin dashboard
 */
export const blockListSettings = {
	button: {
		desc: __("Button blah blah", "mmd"),
		pluginSpecific: false,
		isNew: false,
	},
	disclosure: {
		desc: __("Add an affiliate disclosure blah blah", "mmd"),
		pluginSpecific: false,
		isNew: false,
	},
};

export const mmdGroupSettings = () => {
	const groupBtns = document.querySelectorAll(".mmd-group-btn");

	if (groupBtns) {
		groupBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				const btnParent = btn.parentElement;

				groupBtns.forEach((btnItem) => {
					btnItem.parentElement.removeAttribute("id", "openGroup");
					btnItem.parentElement.classList.remove("mmd-show");
				});

				// Add / Remove .mmd-show class
				if (btnParent.classList.contains("mmd-show")) {
					btnParent.removeAttribute("id", "openGroup");
					btnParent.classList.remove("mmd-show");
				} else {
					btnParent.setAttribute("id", "openGroup");
					btnParent.classList.add("mmd-show");
				}
			});
		});
	}

	// Close on click outside
	window.addEventListener("click", function (e) {
		const openGroup = document.getElementById("openGroup");

		if (openGroup) {
			if (!e.target == openGroup || !openGroup.contains(e.target)) {
				openGroup.removeAttribute("id");
				openGroup.classList.remove("mmd-show");
			}
		}
	});
};
