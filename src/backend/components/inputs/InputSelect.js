import React from "react";
import { mmdConvertToSlug } from "../../helpers";

const InputSelect = (props) => {
	const selectTitleSlug = mmdConvertToSlug(props.slug)
		? mmdConvertToSlug(props.slug)
		: mmdConvertToSlug(props.title);
	const selectOptions = props.options;

	return (
		<React.Fragment>
			<select
				id={selectTitleSlug}
				name={selectTitleSlug}
				onChange={props.onChange}
				value={props.value || props.defaultValue}
				className="snSelect"
			>
				{Object.entries(selectOptions).map(([key, value]) => (
					<option value={key} key={key}>
						{value}
					</option>
				))}
			</select>
		</React.Fragment>
	);
};

export default InputSelect;
