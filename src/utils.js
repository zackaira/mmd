import { __ } from "@wordpress/i18n";

export const conversionFactors = {
	km: 1,
	mi: 0.621371,
	m: 1000,
	ft: 3280.84,
	yd: 1093.61,
	nm: 0.539957,
};

export const convertDistance = (distance, fromUnit, toUnit) => {
	if (isNaN(distance)) return;

	const inKm =
		fromUnit === "km" ? distance : distance / conversionFactors[fromUnit];
	return toUnit === "km" ? inKm : inKm * conversionFactors[toUnit];
};

export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// export const mapStyles = [
// 	{
// 		name: __("Default", "mmd"),
// 		value: "mapbox://styles/zackaira/cm1i12utg00b901r2ezi3abfd",
// 	},
// 	{ name: __("Standard", "mmd"), value: "mapbox://styles/mapbox/standard" },
// 	{ name: __("Streets", "mmd"), value: "mapbox://styles/mapbox/streets-v12" },
// 	{ name: __("Light", "mmd"), value: "mapbox://styles/mapbox/light-v11" },
// 	{ name: __("Dark", "mmd"), value: "mapbox://styles/mapbox/dark-v11" },
// 	{
// 		name: __("Satellite Streets", "mmd"),
// 		value: "mapbox://styles/mapbox/satellite-streets-v12",
// 	},
// ];
