import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as d3 from "d3";

// ELEVATION IS NOT PART OF THE MAPBOX FREE PLAN

const ElevationProfile = ({ route, isVisible }) => {
	const chartRef = useRef(null);

	useEffect(() => {
		if (!isVisible || !route || route.length < 2) return;

		const width = 300;
		const height = 150;
		const margin = { top: 20, right: 20, bottom: 30, left: 50 };

		const svg = d3
			.select(chartRef.current)
			.html("")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		const elevations = route.map((point) => point.elevation);

		const x = d3
			.scaleLinear()
			.domain([0, route.length - 1])
			.range([0, width]);

		const y = d3
			.scaleLinear()
			.domain([d3.min(elevations), d3.max(elevations)])
			.range([height, 0]);

		const line = d3
			.line()
			.x((d, i) => x(i))
			.y((d) => y(d.elevation));

		svg
			.append("path")
			.datum(route)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-width", 1.5)
			.attr("d", line);

		svg
			.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(x));

		svg.append("g").call(d3.axisLeft(y));

		svg
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Elevation (m)");
	}, [route, isVisible]);

	if (!isVisible) return null;

	return <div ref={chartRef} />;
};

export default ElevationProfile;
