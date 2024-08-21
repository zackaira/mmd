import React from "react";
import { mmdConvertToSlug } from "../../helpers";

const InputToggleSwitch = ({ slug, title, value, onChange }) => {
	const inputTitleSlug = mmdConvertToSlug(slug)
		? mmdConvertToSlug(slug)
		: mmdConvertToSlug(title);
	const isChecked = value ? true : false;

	return (
		<React.Fragment>
			<label className="toggle-switch">
				<input
					id={inputTitleSlug}
					name={inputTitleSlug}
					type="checkbox"
					onChange={onChange}
					checked={isChecked}
					className="toggle-switch-checkbox"
				/>
				<span className="toggle-switch-slider"></span>
			</label>
		</React.Fragment>
	);
};

export default InputToggleSwitch;
