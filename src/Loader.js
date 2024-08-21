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
				<div className="mmd-loader-sector mmd-loader-sector-one"></div>
				<div className="mmd-loader-sector mmd-loader-sector-two"></div>
				<div className="mmd-loader-sector mmd-loader-sector-three"></div>
			</div>
		</div>
	);
};

export default Loader;
