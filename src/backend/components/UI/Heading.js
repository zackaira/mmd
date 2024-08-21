import React from "react";

const Heading = ({ title, description, nomargin }) => {
	return (
		<React.Fragment>
			<div className={`mmdheading ${nomargin ? "nomargin" : ""}`}>
				{title && <h4 className="mmdheading-title">{title}</h4>}
				{description && (
					<p className="mmdheading-desc">{description}</p>
				)}
			</div>
		</React.Fragment>
	);
};

export default Heading;
