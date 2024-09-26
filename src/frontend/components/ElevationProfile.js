import React, { useEffect, useState, useCallback } from "react";
import { __ } from "@wordpress/i18n";
import * as turf from "@turf/turf";
import ElevationChart from "./UI/ElevationChart";

const ElevationProfile = ({
	routeCoordinates,
	mapRef,
	units = "km",
	isPremiumUser,
	onClose,
}) => {
	const [elevationData, setElevationData] = useState([]);
	const [totalGain, setTotalGain] = useState(0);
	const [totalLoss, setTotalLoss] = useState(0);
	const [totalDistance, setTotalDistance] = useState(0);
	// const [debugInfo, setDebugInfo] = useState("");

	const getElevation = useCallback(
		async (coordinates) => {
			if (!mapRef?.current) {
				console.warn("Map reference is not available");
				return 0;
			}

			let elevation = 0;
			let attempts = 0;
			const maxAttempts = 3;

			while (attempts < maxAttempts) {
				try {
					if (mapRef.current.queryTerrainElevation) {
						elevation = mapRef.current.queryTerrainElevation(coordinates) || 0;
						if (elevation !== 0) break;
					} else {
						console.warn("queryTerrainElevation not available");
						// Implement a fallback method or API call here
						break;
					}
				} catch (error) {
					console.error(`Attempt ${attempts + 1} failed:`, error);
				}
				attempts++;
				await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms before retry
			}

			return Number(elevation.toFixed(2)); // Consistent precision
		},
		[mapRef]
	);

	const calculateRollingAverage = (data, windowSize = 5) => {
		const smoothedData = [];
		for (let i = 0; i < data.length; i++) {
			let sum = 0;
			let count = 0;
			for (
				let j = Math.max(0, i - Math.floor(windowSize / 2));
				j < Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
				j++
			) {
				sum += data[j].elevation;
				count++;
			}
			smoothedData.push({
				distance: data[i].distance,
				elevation: sum / count,
			});
		}
		return smoothedData;
	};

	const calculateElevationStats = useCallback((data) => {
		const smoothedData = calculateRollingAverage(data);
		let gain = 0;
		let loss = 0;
		let prevElevation = smoothedData[0].elevation;

		for (let i = 1; i < smoothedData.length; i++) {
			const diff = smoothedData[i].elevation - prevElevation;
			if (diff > 0) {
				gain += diff;
			} else {
				loss += Math.abs(diff);
			}
			prevElevation = smoothedData[i].elevation;
		}

		setTotalGain(Math.round(gain));
		setTotalLoss(Math.round(loss));
		return smoothedData;
	}, []);

	const fetchElevationData = useCallback(
		async (coordinates) => {
			if (!mapRef?.current) return;

			try {
				const route = turf.lineString(coordinates);
				const length = turf.length(route, { units: "kilometers" });
				const numSamples = Math.min(500, Math.ceil(length * 10)); // 1 sample per 100m, max 500 samples

				const elevations = [];
				let totalElevation = 0;

				for (let i = 0; i <= numSamples; i++) {
					const point = turf.along(route, (i / numSamples) * length, {
						units: "kilometers",
					});
					const elevation = await getElevation(point.geometry.coordinates);
					elevations.push({
						distance: Number(((i / numSamples) * length).toFixed(3)),
						elevation: elevation,
					});
					totalElevation += elevation;
				}

				const smoothedData = calculateElevationStats(elevations);

				setTimeout(() => {
					setElevationData(smoothedData);
					setTotalDistance(Number(length.toFixed(3)));
				}, 200);

				// Debug information
				// setDebugInfo(
				// 	`Samples: ${numSamples + 1}, Avg Elevation: ${(
				// 		totalElevation /
				// 		(numSamples + 1)
				// 	).toFixed(2)}m`
				// );
			} catch (error) {
				console.error("Error fetching elevation data:", error);
				// setDebugInfo(`Error: ${error.message}`);
			}
		},
		[mapRef, getElevation, calculateElevationStats]
	);

	useEffect(() => {
		if (routeCoordinates && routeCoordinates.length > 0 && mapRef?.current) {
			fetchElevationData(routeCoordinates);
		}
	}, [routeCoordinates, mapRef, fetchElevationData]);

	if (!routeCoordinates || routeCoordinates.length === 0 || !mapRef?.current) {
		return (
			<div>{__("No route data available or map not initialized", "mmd")}</div>
		);
	}

	const distanceUnit = units === "km" ? "km" : "mi";
	const distanceMultiplier = units === "km" ? 1 : 0.621371;

	return (
		<>
			<div className="mmd-popup-bg elevation" onClick={onClose}></div>
			<div className="mmd-elevation-profile">
				<div className="mmd-elevation-totals">
					<div>
						{__("Total Distance", "mmd")}:{" "}
						<span>
							{(totalDistance * distanceMultiplier).toFixed(2)} {distanceUnit}
						</span>
					</div>
					<div>
						{__("Total Elevation Gain", "mmd")}: <span>{totalGain}m</span>
					</div>
					<div>
						{__("Total Elevation Loss", "mmd")}: <span>{totalLoss}m</span>
					</div>
					{/* <div>Debug: {debugInfo}</div> */}
				</div>
				{isPremiumUser && (
					<ElevationChart elevationData={elevationData} units={units} />
				)}
			</div>
		</>
	);
};

export default ElevationProfile;
