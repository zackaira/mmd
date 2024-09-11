import React, { useState, useEffect, useCallback } from "react";
import { __ } from "@wordpress/i18n";

const ElevationProfile = ({
	map,
	coordinates,
	units,
	onElevationCalculated,
}) => {
	const [elevationGain, setElevationGain] = useState(0);
	const [elevationLoss, setElevationLoss] = useState(0);

	const calculateElevation = useCallback(() => {
		if (!map || !map.loaded() || coordinates.length < 2) {
			setElevationGain(0);
			setElevationLoss(0);
			onElevationCalculated && onElevationCalculated(0, 0);
			return;
		}

		let totalGain = 0;
		let totalLoss = 0;
		let prevElevation = null;

		coordinates.forEach((coordinate) => {
			const elevation = map.queryTerrainElevation(coordinate);

			if (elevation !== null) {
				if (prevElevation !== null) {
					const diff = elevation - prevElevation;
					if (diff > 0) {
						totalGain += diff;
					} else {
						totalLoss += Math.abs(diff);
					}
				}
				prevElevation = elevation;
			}
		});

		const roundedGain = Math.round(totalGain);
		const roundedLoss = Math.round(totalLoss);

		setElevationGain(roundedGain);
		setElevationLoss(roundedLoss);
		onElevationCalculated && onElevationCalculated(roundedGain, roundedLoss);
	}, [map, coordinates, onElevationCalculated]);

	useEffect(() => {
		if (map && map.loaded()) {
			calculateElevation();
		} else if (map) {
			const onLoad = () => {
				calculateElevation();
				map.off("load", onLoad);
			};
			map.on("load", onLoad);
			return () => map.off("load", onLoad);
		}
	}, [map, coordinates, calculateElevation]);

	const elevationUnit = units === "mi" ? "ft" : "m";
	const elevationMultiplier = units === "mi" ? 3.28084 : 1; // Convert to feet if units are miles

	return (
		<div className="mmd-elevation-profile">
			<div>
				{__("Elevation Gain", "mmd")}:{" "}
				{Math.round(elevationGain * elevationMultiplier)} {elevationUnit}
			</div>
			<div>
				{__("Elevation Loss", "mmd")}:{" "}
				{Math.round(elevationLoss * elevationMultiplier)} {elevationUnit}
			</div>
		</div>
	);
};

export default ElevationProfile;
