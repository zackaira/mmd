import React from "react";

const Loader = ({ height, width, hasBg, loaderText }) => {
	const setHeight = height ? height : false;
	const setWidth = width ? width : false;

	return (
		<div className={`mmd-loader-wrap ${hasBg ? "mmd-loader-bg" : ""}`}>
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
			{loaderText && <p className="mmd-loader-text">{loaderText}</p>}
		</div>
	);
};

export default Loader;
