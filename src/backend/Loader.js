import React from "react";

const Loader = ({ height, width }) => {
	const setHeight = height ? height : false;
	const setWidth = width ? width : false;

	return (
		<div className="mmd-loader-wrap">
			<div
				className="mmd-loader"
				{...(setHeight || setWidth
					? {
							style: {
								...(setHeight ? { height: setHeight } : {}),
								...(setWidth ? { width: setWidth } : {}),
							},
					  }
					: {})}
			>
				<div className="mmd-spinner-text"></div>
				<div className="mmd-loader-sector mmd-loader-sector-blue"></div>
				<div className="mmd-loader-sector mmd-loader-sector-pink"></div>
				<div className="mmd-loader-sector mmd-loader-sector-purple"></div>
			</div>
		</div>
	);
};

export default Loader;
