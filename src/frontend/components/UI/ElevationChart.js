import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { __ } from "@wordpress/i18n";

const ElevationChart = ({ elevationData, units }) => {
	const chartRef = useRef(null);
	const chartInstance = useRef(null);

	useEffect(() => {
		if (elevationData.length > 0) {
			createChart();
		}
	}, [elevationData, units]);

	const createChart = () => {
		if (chartRef.current) {
			const ctx = chartRef.current.getContext("2d");

			if (chartInstance.current) {
				chartInstance.current.destroy();
			}

			const distanceUnit = units;
			const distanceMultiplier =
				units === "km"
					? 1
					: units === "mi"
					? 0.621371
					: units === "nm"
					? 0.539957
					: units === "m"
					? 1000
					: units === "ft"
					? 3280.84
					: units === "yd"
					? 1093.61
					: 1;

			const scaledData = elevationData.map((d) => ({
				distance: d.distance * distanceMultiplier,
				elevation: d.elevation,
			}));

			const maxDistance = Math.max(...scaledData.map((d) => d.distance));
			const minElevation = Math.min(...scaledData.map((d) => d.elevation));
			const maxElevation = Math.max(...scaledData.map((d) => d.elevation));

			chartInstance.current = new Chart(ctx, {
				type: "line",
				data: {
					labels: scaledData.map((d) => d.distance),
					datasets: [
						{
							label: __("Elevation", "mmd"),
							data: scaledData.map((d) => ({ x: d.distance, y: d.elevation })),
							borderColor: "#2e9632",
							tension: 0.1,
							fill: true,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							mode: "index",
							intersect: false,
							callbacks: {
								title: function (tooltipItems) {
									const distance = tooltipItems[0].parsed.x;
									return `Distance: ${distance.toFixed(2)} ${distanceUnit}`;
								},
								label: function (context) {
									const elevation = context.parsed.y;
									return `Elevation: ${elevation.toFixed(0)} m`;
								},
							},
						},
					},
					elements: {
						point: {
							pointStyle: false,
						},
					},
					scales: {
						x: {
							type: "linear",
							min: 0,
							max: maxDistance,
							title: {
								display: true,
								text: __(`Distance (${distanceUnit})`, "mmd"),
							},
							ticks: {
								stepSize: 0.5 / distanceMultiplier,
								callback: function (value, index, values) {
									if (
										value % (0.5 / distanceMultiplier) < 0.001 ||
										value === maxDistance
									) {
										return value.toFixed(1);
									}
									return null;
								},
								font: function (context) {
									if (
										context &&
										context.tick &&
										typeof context.tick.value === "number"
									) {
										const kmValue = context.tick.value * distanceMultiplier;
										if (
											Number.isInteger(kmValue) ||
											context.tick.value === maxDistance
										) {
											return {
												weight: "bold",
											};
										}
									}
									return {};
								},
								color: function (context) {
									if (
										context &&
										context.tick &&
										typeof context.tick.value === "number"
									) {
										const kmValue = context.tick.value * distanceMultiplier;
										if (
											!Number.isInteger(kmValue) &&
											context.tick.value !== maxDistance
										) {
											return "#999";
										}
									}
									return undefined;
								},
							},
							grid: {
								display: false,
							},
						},
						y: {
							min: Math.floor(minElevation / 10) * 10,
							max: Math.ceil(maxElevation / 10) * 10,
							title: {
								display: true,
								text: __("Elevation (m)", "mmd"),
							},
							ticks: {
								stepSize: 10,
							},
							grid: {
								display: false,
							},
						},
					},
				},
			});
		}
	};

	return <canvas ref={chartRef} id="mmd-elevation-chart"></canvas>;
};

export default ElevationChart;
