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
	const [debugInfo, setDebugInfo] = useState("");

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

	const calculateElevationStats = useCallback((data, options = {}) => {
		const {
			smoothingWindow = 5, // the number of data points used in the rolling average calculation
			minElevationChange = 1, // the minimum elevation change to be considered
			samplingInterval = 1, // the number of data points to skip when sampling the data
		} = options;

		// console.log("Raw elevation data:", data);

		// console.log("Calculation parameters:", {
		// 	smoothingWindow,
		// 	minElevationChange,
		// 	samplingInterval,
		// });
		// console.log("Raw data length:", data.length);

		// Adjust sampling rate
		const sampledData = data.filter(
			(_, index) => index % samplingInterval === 0
		);

		// Smoothing function
		const smoothData = (data, window) => {
			return data.map((d, i, arr) => {
				const start = Math.max(0, i - Math.floor(window / 2));
				const end = Math.min(arr.length, i + Math.floor(window / 2) + 1);
				const windowSlice = arr.slice(start, end);
				const sum = windowSlice.reduce((acc, cur) => acc + cur.elevation, 0);
				return { ...d, elevation: sum / windowSlice.length };
			});
		};

		const smoothedData = smoothData(sampledData, smoothingWindow);

		let gain = 0;
		let loss = 0;
		let prevElevation = smoothedData[0].elevation;

		const elevationChanges = [];

		for (let i = 1; i < smoothedData.length; i++) {
			const diff = smoothedData[i].elevation - prevElevation;
			if (Math.abs(diff) >= minElevationChange) {
				if (diff > 0) {
					gain += diff;
				} else {
					loss += Math.abs(diff);
				}
				elevationChanges.push({
					index: i,
					change: diff,
					cumulative: diff > 0 ? gain : -loss,
				});
			}
			prevElevation = smoothedData[i].elevation;
		}

		// console.log("Elevation changes:", elevationChanges);

		setTotalGain(Math.round(gain));
		setTotalLoss(Math.round(loss));

		return {
			smoothedData,
			elevationChanges,
			gain,
			loss,
		};
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

				setTimeout(() => {
					const { smoothedData, gain, loss } = calculateElevationStats(
						elevations,
						{
							smoothingWindow: 10,
							minElevationChange: 1.5,
							samplingInterval: 1,
						}
					);
					setElevationData(smoothedData);
					setTotalDistance(Number(length.toFixed(3)));
					setTotalGain(Math.round(gain));
					setTotalLoss(Math.round(loss));

					// Debug information
					// setDebugInfo(
					// 	`Samples: ${numSamples + 1}, Avg Elevation: ${(
					// 		totalElevation /
					// 		(numSamples + 1)
					// 	).toFixed(2)}m, Raw Gain: ${gain.toFixed(
					// 		2
					// 	)}m, Raw Loss: ${loss.toFixed(2)}m`
					// );
				}, 300);
			} catch (error) {
				console.error("Error fetching elevation data:", error);
				setDebugInfo(`Error: ${error.message}`);
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
			{isPremiumUser && (
				<div className="mmd-popup-bg elevation" onClick={onClose}></div>
			)}
			<div
				className={`mmd-elevation-profile ${!isPremiumUser ? "mini" : "full"}`}
			>
				<div className="mmd-elevation-totals">
					<div>
						{__("Total Elevation Gain", "mmd")}: <span>{totalGain}m</span>
					</div>
					<div>
						{__("Total Elevation Loss", "mmd")}: <span>{totalLoss}m</span>
					</div>
					{!isPremiumUser && (
						<div className="mmd-elevation-note">
							<a href="#" target="_blank">
								{__("Get A Full Elevation Graph", "mmd")}
							</a>
						</div>
					)}
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
