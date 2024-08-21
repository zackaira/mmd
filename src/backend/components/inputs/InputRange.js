import React, { useState, useEffect } from "react";
import { mmdConvertToSlug } from "../../helpers";

const InputRange = (props) => {
	const rangeTitleSlug = mmdConvertToSlug(props.slug)
		? mmdConvertToSlug(props.slug)
		: mmdConvertToSlug(props.title);
	const [rangeValue, setRangeValue] = useState(0);
	const theDefault = props.defaultValue ? props.defaultValue : props.min;

	useEffect(() => {
		props.value ? setRangeValue(props.value) : setRangeValue(theDefault);
	}, [props.value]);

	return (
		<React.Fragment>
			<div className="mmdRange">
				<div className="mmdRangeInput">
					<span>{props.min}</span>
					<input
						type="range"
						id={rangeTitleSlug}
						name={rangeTitleSlug}
						onChange={props.onChange}
						value={rangeValue}
						min={props.min ? props.min : 0}
						max={props.max ? props.max : 500}
						step={props.step ? props.step : 1}
					/>
					<span>{props.max ? props.max : 500}</span>
				</div>
				<div className="mmdRangeInputVal">
					<input type="text" value={rangeValue} readOnly />
					{props.suffix ? props.suffix : ""}
				</div>
			</div>
		</React.Fragment>
	);
};

export default InputRange;
