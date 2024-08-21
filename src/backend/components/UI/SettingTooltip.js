import React from "react";

const SettingTooltip = (props) => {
	return (
		<React.Fragment>
			<div className="mmd-tooltip">
				<span className="mmd-tooltiptxt">{props.tooltip}</span>
			</div>
		</React.Fragment>
	);
};

export default SettingTooltip;
