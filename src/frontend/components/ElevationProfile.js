import { useEffect, useState } from "react";
import Chart from "chart.js/auto";

const ElevationProfile = () => {
	return (
		<div className="mmd-elevation-profile">
			<div className="mmd-elevation-totals">
				Total Elevation Gain: <span>0m</span>
				Total Elevation Loss: <span>0m</span>
			</div>

			<div id="mmd-elevation-chart"></div>
		</div>
	);
};

export default ElevationProfile;
