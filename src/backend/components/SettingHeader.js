import React from "react";

const SettingHeader = ({ title, description }) => {
	return (
		<React.Fragment>
			<div className="mmd-header">
				{title && <h3 className="mmd-title">{title}</h3>}
				{description && <p>{description}</p>}
			</div>
		</React.Fragment>
	);
};

export default SettingHeader;
