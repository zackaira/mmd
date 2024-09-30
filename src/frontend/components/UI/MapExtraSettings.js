import React, { useState } from "react";
import { __ } from "@wordpress/i18n";

const MapExtraSettings = ({ showDistanceMarkers, onToggleDistanceMarkers }) => {
	const [controlsVisible, setControlsVisible] = useState(false);

	const toggleControls = () => {
		setControlsVisible(!controlsVisible);
	};

	return (
		<div className={`mapbox-extraset ${controlsVisible ? "open" : ""}`}>
			<div className="mapbox-extraset-icon" onClick={toggleControls}>
				<span className="fa-solid fa-gear"></span>
			</div>

			<div
				className={`mapbox-extraset-controls ${
					controlsVisible ? "visible" : ""
				}`}
			>
				<h4>{__("Settings", "mmd")}</h4>
				<div className="mapbox-extraset-control">
					<label>
						<input
							type="checkbox"
							checked={showDistanceMarkers}
							onChange={onToggleDistanceMarkers}
						/>
						{__("Show distance markers", "mmd")}
					</label>
				</div>
			</div>
		</div>
	);
};

export default MapExtraSettings;
