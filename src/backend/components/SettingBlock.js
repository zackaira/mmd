import React from "react";
import InputToggleSwitch from "./inputs/InputToggleSwitch";

const SettingRow = (props) => {
	return (
		<React.Fragment>
			<div className={`mmd-block ${props.disable ? "disabled" : ""}`}>
				<div className="mmd-block-inner">
					{props.isNew && <div className="newbanner">{props.isNew}</div>}
					{props.pluginSpecific && (
						<div className="pluginbanner">{props.pluginSpecific}</div>
					)}

					{props.title && (
						<h4 className="mmd-block-title">{props.title}</h4>
					)}
					{props.description && (
						<p className="mmd-block-desc">{props.description}</p>
					)}
					<InputToggleSwitch {...props} />
				</div>
			</div>
		</React.Fragment>
	);
};

export default SettingRow;
