import React, { useState, useEffect, useRef, useCallback } from "react";
import { __ } from "@wordpress/i18n";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import MapBoxControls from "./MapBoxControls";
import mapboxSdk from "@mapbox/mapbox-sdk/umd/mapbox-sdk.min.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchPopup from "./SearchPopup";
import SaveSharePopup from "./SaveSharePopup";
import Loader from "../../Loader";

mapboxgl.accessToken =
	"pk.eyJ1IjoiemFja2FpcmEiLCJhIjoiY2x6czFzcDlnMGk4eDJpczk0aGU1Zms0aiJ9.rtKaICIv9h1DOrpNupfRzw";

const conversionFactors = {
	km: 1,
	mi: 0.621371,
	m: 1000,
	ft: 3280.84,
	yd: 1093.61,
	nm: 0.539957,
};

const convertDistance = (distance, fromUnit, toUnit) => {
	const inKm =
		fromUnit === "km" ? distance : distance / conversionFactors[fromUnit];
	return toUnit === "km" ? inKm : inKm * conversionFactors[toUnit];
};

const MapBox = ({ mmdObj }) => {
	const userDetails = mmdObj?.userDetails || false;
	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const geojsonRef = useRef({
		type: "FeatureCollection",
		features: [],
	});
	const linestringRef = useRef({
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [],
		},
	});

	const [isLoading, setIsLoading] = useState(false);
	const [isRouteEditable, setIsRouteEditable] = useState(true);
	const [isRouteClosed, setIsRouteClosed] = useState(false);

	const [rawLastDistance, setRawLastDistance] = useState(0);
	const [rawFullDistance, setRawFullDistance] = useState(0);
	const [lastDistance, setLastDistance] = useState(0);
	const [fullDistance, setFullDistance] = useState(0);
	const [units, setUnits] = useState("km");
	const [latestLatLng, setLatestLatLng] = useState(null);
	const [userLocation, setUserLocation] = useState(null);
	const historyRef = useRef([]);
	const futureRef = useRef([]);
	const canZoomToBounds =
		linestringRef.current.geometry.coordinates.length >= 2;

	const mapboxClient = useRef(mapboxSdk({ accessToken: mapboxgl.accessToken }));
	const snapToRoutesRef = useRef(true);
	const [snapToRoutes, setSnapToRoutes] = useState(true);
	const [centerOnNewMarker, setCenterOnNewMarker] = useState(true);

	// const [routeWithElevation, setRouteWithElevation] = useState([]);
	// const [showElevationProfile, setShowElevationProfile] = useState(false);

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isSaveShareOpen, setIsSaveShareOpen] = useState(false);
	const [saveShareAction, setSaveShareAction] = useState("save");

	useEffect(() => {
		const routeId = mmdObj.routeId;
		if (routeId && !mapRef.current) {
			loadSavedRoute(routeId);
		}
	}, [mmdObj.routeId]);

	const loadSavedRoute = async (routeId) => {
		if (!routeId || isLoading) return;

		setIsRouteEditable(false);
		setIsLoading(true);

		try {
			const response = await fetch(
				`${mmdObj.apiUrl}mmd-api/v1/get-route/${routeId}`,
				{
					headers: {
						"X-WP-Nonce": mmdObj.nonce,
					},
				}
			);

			if (!response.ok) {
				throw new Error("Failed to load route");
			}

			const routeData = await response.json();
			if (routeData.route_data) {
				const parsedRouteData =
					typeof routeData.route_data === "string"
						? JSON.parse(routeData.route_data)
						: routeData.route_data;

				updateMapWithRouteData(parsedRouteData);

				// Remove the click event listener from the map
				if (mapRef.current) {
					mapRef.current.off("click", handleMapClick);
				}

				toast.success("Route loaded successfully!", {
					toastId: routeId,
				});
			} else {
				throw new Error("Route data not found");
			}
		} catch (error) {
			toast.error("Route not found or couldn't be loaded.", {
				toastId: routeId,
			});
			window.history.pushState({}, "", "/mapmydistance/");
		} finally {
			setIsLoading(false);
			setTimeout(() => forceZoomToBounds(), 400);
		}
	};

	const toggleRouteEditable = useCallback(() => {
		setIsRouteEditable((prev) => {
			const newValue = !prev;
			if (newValue) {
				mapRef.current?.on("click", handleMapClick);
			} else {
				mapRef.current?.off("click", handleMapClick);
			}
			toast.success(
				newValue
					? __("Route is now editable.", "mmd")
					: __("Route is no longer editable.", "mmd"),
				{
					toastId: "route-editable",
				}
			);
			return newValue;
		});
	}, [handleMapClick]);

	const updateMapWithRouteData = (routeData) => {
		setIsRouteEditable(false);

		// Update geojsonRef and linestringRef
		geojsonRef.current = {
			type: "FeatureCollection",
			features: [
				...routeData.coordinates.map((coord, index) => ({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: coord,
					},
					properties: {
						markerNumber: index + 1,
					},
				})),
				{
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: routeData.linestring,
					},
					properties: {},
				},
			],
		};

		linestringRef.current = {
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: routeData.linestring,
			},
		};

		// Set the distance and units
		setRawFullDistance(routeData.fullDistance);
		setUnits(routeData.units);

		// Update latest lat/lng
		if (routeData.coordinates.length > 0) {
			setLatestLatLng(routeData.coordinates[routeData.coordinates.length - 1]);
		}

		// Recalculate distances
		recalculateDistances();

		// Function to update map and zoom to bounds
		const updateMapAndZoom = () => {
			if (mapRef.current && mapRef.current.getSource("geojson")) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);

				if (routeData.bounds && routeData.bounds.length === 2) {
					const [sw, ne] = routeData.bounds;
					mapRef.current.fitBounds([sw, ne], {
						padding: { top: 50, bottom: 50, left: 50, right: 50 },
						duration: 1000,
						maxZoom: 15,
					});
				} else {
					forceZoomToBounds();
				}
			} else {
				setTimeout(updateMapAndZoom, 100);
			}
		};

		if (mapRef.current && mapRef.current.loaded()) {
			updateMapAndZoom();
		} else if (mapRef.current) {
			mapRef.current.once("load", updateMapAndZoom);
		}
	};

	const forceZoomToBounds = () => {
		if (
			mapRef.current &&
			linestringRef.current.geometry.coordinates.length > 1
		) {
			const bounds = new mapboxgl.LngLatBounds();
			linestringRef.current.geometry.coordinates.forEach((coord) => {
				bounds.extend(coord);
			});

			mapRef.current.fitBounds(bounds, {
				padding: { top: 50, bottom: 50, left: 50, right: 50 },
				duration: 1000,
				maxZoom: 15,
			});
		}
	};

	const handleToggleSearch = useCallback(() => {
		setIsSearchOpen((prev) => !prev);
	}, []);

	const handleToggleSaveShare = useCallback(
		(action) => {
			if (action === "save") {
				const routeData = {
					coordinates: geojsonRef.current.features
						.filter((feature) => feature.geometry.type === "Point")
						.map((feature) => feature.geometry.coordinates),
					linestring: linestringRef.current.geometry.coordinates,
					fullDistance: rawFullDistance, // Use the raw distance in km
					units: units,
					bounds: mapRef.current.getBounds().toArray(),
				};
				setIsSaveShareOpen(true);
				setSaveShareAction({ action, routeData });
			} else {
				setIsSaveShareOpen((prev) => !prev);
				setSaveShareAction({ action, routeData: null });
			}
		},
		[geojsonRef, linestringRef, rawFullDistance, units]
	);

	const saveState = useCallback(() => {
		return {
			geojson: JSON.parse(JSON.stringify(geojsonRef.current)),
			linestring: JSON.parse(JSON.stringify(linestringRef.current)),
			isRouteClosed: isRouteClosed,
		};
	}, [isRouteClosed]);

	const restoreState = useCallback((state) => {
		geojsonRef.current = state.geojson;
		linestringRef.current = state.linestring;
		setIsRouteClosed(state.isRouteClosed);
	}, []);

	const updateDistances = useCallback((currentUnits) => {
		const markers = geojsonRef.current.features.filter(
			(feature) => feature.geometry.type === "Point"
		);

		if (markers.length >= 2) {
			let totalDistanceKm = 0;
			let lastDistanceKm = 0;

			for (let i = 1; i < markers.length; i++) {
				const segmentDistanceKm = turf.distance(
					markers[i - 1].geometry.coordinates,
					markers[i].geometry.coordinates,
					{ units: "kilometers" }
				);
				totalDistanceKm += segmentDistanceKm;

				if (i === markers.length - 1) {
					lastDistanceKm = segmentDistanceKm;
				}
			}

			const fullDistanceConverted = convertDistance(
				totalDistanceKm,
				"km",
				currentUnits
			);
			setFullDistance(fullDistanceConverted);

			const lastDistanceConverted = convertDistance(
				lastDistanceKm,
				"km",
				currentUnits
			);
			setLastDistance(lastDistanceConverted);
		} else {
			setFullDistance(0);
			setLastDistance(0);
		}
	}, []);

	useEffect(() => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocation([longitude, latitude]);
				},
				(error) => {
					console.error("Error getting user location:", error);
					setUserLocation([-74.5, 40]); // Fallback location
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				}
			);
		} else {
			toast.error("Geolocation did not load in your browser.", {
				toastId: routeId,
			});
			setUserLocation([-74.5, 40]); // Fallback location
		}
	}, []);

	useEffect(() => {
		if (!userLocation || mapRef.current) return;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/streets-v12",
			center: userLocation,
			zoom: 14,
		});
		mapRef.current = map;

		map.on("load", () => {
			map.addSource("geojson", {
				type: "geojson",
				data: geojsonRef.current,
			});

			map.addLayer({
				id: "measure-lines",
				type: "line",
				source: "geojson",
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
				paint: {
					"line-color": "#000",
					"line-width": 2,
				},
				filter: ["in", "$type", "LineString"],
			});

			map.addLayer({
				id: "measure-points",
				type: "circle",
				source: "geojson",
				paint: {
					"circle-radius": 8,
					"circle-color": [
						"case",
						[
							"all",
							["==", ["get", "markerNumber"], 1],
							["==", ["to-boolean", ["get", "isRouteClosed"]], false],
							[">=", ["get", "totalMarkers"], 2], // New line: Check if there are 2 or more markers
						],
						"#2e9632", // Green color for clickable first marker
						["==", ["get", "markerNumber"], 1],
						"#000000", // Grey color for non-clickable first marker (changed from "#FF0000")
						"#000000", // Black color for other markers
					],
				},
				filter: ["in", "$type", "Point"],
			});

			map.addLayer({
				id: "measure-points-number",
				type: "symbol",
				source: "geojson",
				layout: {
					"text-field": ["get", "markerNumber"],
					"text-font": ["Open Sans Bold"],
					"text-size": 9,
					"text-allow-overlap": true,
				},
				paint: {
					"text-color": "#ffffff",
				},
				filter: ["in", "$type", "Point"],
			});

			if (isRouteEditable) {
				map.on("click", handleMapClick);
			}

			map.on("mousemove", (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ["measure-points"],
				});
				map.getCanvas().style.cursor = features.length
					? "pointer"
					: "crosshair";
			});
		});

		return () => map.remove();
	}, [userLocation, handleMapClick, mmdObj.routeId]);

	const handleMapClick = useCallback(
		async (e) => {
			if (!isRouteEditable) return;

			const map = mapRef.current;
			if (!map) return;

			historyRef.current.push(saveState());
			futureRef.current = [];

			const features = map.queryRenderedFeatures(e.point, {
				layers: ["measure-points"],
			});

			const newPoint = [e.lngLat.lng, e.lngLat.lat];

			const markerCount = geojsonRef.current.features.filter(
				(feature) => feature.geometry.type === "Point"
			).length;

			if (
				features.length > 0 &&
				features[0].properties.markerNumber === 1 &&
				!isRouteClosed &&
				markerCount >= 3 // Only allow closing the route if there are 3 or more markers
			) {
				// Clicking on the first marker to close the route
				await updateRoute(newPoint, true);

				toast.success("Route completed!", {
					toastId: "route-closed",
				});
			} else if (!features.length) {
				// Adding a new point
				await updateRoute(newPoint, false);
			}

			// Update the map
			map.getSource("geojson").setData(geojsonRef.current);
			setLatestLatLng(newPoint);
		},
		[isRouteEditable, saveState, updateRoute, isRouteClosed]
	);

	const updateRoute = useCallback(
		async (newPoint, isClosingLoop) => {
			const currentCoords = linestringRef.current.geometry.coordinates;
			let updatedCoords;

			if (snapToRoutesRef.current && currentCoords.length > 0) {
				try {
					const lastCoord = currentCoords[currentCoords.length - 1];
					const targetCoord = isClosingLoop ? currentCoords[0] : newPoint;
					const response = await mapboxClient.current.directions
						.getDirections({
							profile: "walking",
							geometries: "geojson",
							waypoints: [
								{ coordinates: lastCoord },
								{ coordinates: targetCoord },
							],
						})
						.send();

					const routeSegment = response.body.routes[0].geometry.coordinates;
					updatedCoords = [...currentCoords, ...routeSegment.slice(1)];
				} catch (error) {
					console.error("Error fetching route:", error);
					updatedCoords = [
						...currentCoords,
						isClosingLoop ? currentCoords[0] : newPoint,
					];
				}
			} else {
				updatedCoords = [
					...currentCoords,
					isClosingLoop ? currentCoords[0] : newPoint,
				];
			}

			// Update linestring
			linestringRef.current.geometry.coordinates = updatedCoords;

			// Count existing point features and calculate new total
			const pointFeatures = geojsonRef.current.features.filter(
				(f) => f.geometry.type === "Point"
			);
			const totalMarkers = pointFeatures.length + (isClosingLoop ? 0 : 1);

			// Update totalMarkers for all existing point features
			geojsonRef.current.features = geojsonRef.current.features.map(
				(feature) => {
					if (feature.geometry.type === "Point") {
						return {
							...feature,
							properties: {
								...feature.properties,
								totalMarkers,
							},
						};
					}
					return feature;
				}
			);

			// Only add a new marker if we're not closing the loop and it doesn't already exist
			if (
				!isClosingLoop &&
				!geojsonRef.current.features.some(
					(f) =>
						f.geometry.type === "Point" &&
						f.geometry.coordinates[0] === newPoint[0] &&
						f.geometry.coordinates[1] === newPoint[1]
				)
			) {
				const newMarker = {
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: newPoint,
					},
					properties: {
						id: String(new Date().getTime()),
						markerNumber: totalMarkers,
						totalMarkers,
					},
				};

				// Add the new marker to the features array
				geojsonRef.current.features.push(newMarker);
			}

			// Update the linestring in the features array
			const lineStringIndex = geojsonRef.current.features.findIndex(
				(f) => f.geometry.type === "LineString"
			);
			if (lineStringIndex !== -1) {
				geojsonRef.current.features[lineStringIndex] = linestringRef.current;
			} else {
				geojsonRef.current.features.push(linestringRef.current);
			}

			// Set isRouteClosed when closing the loop
			if (isClosingLoop) {
				setIsRouteClosed(true);
			}

			// Force a recalculation of distances
			recalculateDistances();
		},
		[recalculateDistances, snapToRoutesRef]
	);

	useEffect(() => {
		if (!mapRef.current) return;

		// Remove existing click listener
		mapRef.current.off("click", handleMapClick);

		// Only add the click listener if the route is editable
		if (isRouteEditable) {
			mapRef.current.on("click", handleMapClick);
		}

		return () => {
			if (mapRef.current) {
				mapRef.current.off("click", handleMapClick);
			}
		};
	}, [isRouteEditable, handleMapClick]);

	useEffect(() => {
		snapToRoutesRef.current = snapToRoutes;
	}, [snapToRoutes]);

	useEffect(() => {
		updateDistances(units);
	}, [units, updateDistances]);

	useEffect(() => {
		setFullDistance(convertDistance(rawFullDistance, "km", units));
		setLastDistance(convertDistance(rawLastDistance, "km", units));
	}, [rawFullDistance, rawLastDistance, units]);

	useEffect(() => {
		if (
			mapRef.current &&
			linestringRef.current.geometry.coordinates.length > 0
		) {
			const lastCoord = linestringRef.current.geometry.coordinates.slice(-1)[0];
			if (centerOnNewMarker) {
				mapRef.current.flyTo({
					center: lastCoord,
					// zoom: 14,
					duration: 1000,
				});
			}
		}
	}, [linestringRef.current.geometry.coordinates, centerOnNewMarker]);

	const handleUnitChange = useCallback((newUnits) => {
		setUnits(newUnits);
	}, []);

	const toggleCenterOnNewMarker = useCallback(() => {
		setCenterOnNewMarker((prev) => !prev);
	}, []);

	const handleSnapToggle = useCallback(() => {
		setSnapToRoutes((prev) => {
			const newValue = !prev;
			snapToRoutesRef.current = newValue;
			return newValue;
		});
	}, []);

	const recalculateDistances = useCallback(() => {
		const lineString = linestringRef.current.geometry.coordinates;

		if (lineString.length >= 2) {
			let totalDistanceKm = 0;
			let lastDistanceKm = 0;

			for (let i = 1; i < lineString.length; i++) {
				const segmentDistanceKm = turf.distance(
					lineString[i - 1],
					lineString[i],
					{ units: "kilometers" }
				);
				totalDistanceKm += segmentDistanceKm;

				if (i === lineString.length - 1) {
					lastDistanceKm = segmentDistanceKm;
				}
			}

			setRawFullDistance(totalDistanceKm);
			setRawLastDistance(lastDistanceKm);

			// Update the displayed distances
			setFullDistance(convertDistance(totalDistanceKm, "km", units));
			setLastDistance(convertDistance(lastDistanceKm, "km", units));
		} else {
			setRawFullDistance(0);
			setRawLastDistance(0);
			setFullDistance(0);
			setLastDistance(0);
		}
	}, [units]);

	const handleUndo = useCallback(() => {
		if (historyRef.current.length > 0) {
			const currentState = saveState();
			const previousState = historyRef.current.pop();

			futureRef.current.unshift(currentState);
			restoreState(previousState);

			// Update the map immediately
			if (mapRef.current) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);
			}

			// Recalculate distances after restoring the state
			recalculateDistances();

			// Update latest lat/lng
			const lastPoint = geojsonRef.current.features
				.filter((f) => f.geometry.type === "Point")
				.pop();
			if (lastPoint) {
				setLatestLatLng(lastPoint.geometry.coordinates);
			} else {
				setLatestLatLng(null);
			}
		}
	}, [saveState, restoreState, recalculateDistances]);

	const handleRedo = useCallback(() => {
		if (futureRef.current.length > 0) {
			const currentState = saveState();
			const nextState = futureRef.current.shift();

			historyRef.current.push(currentState);
			restoreState(nextState);

			// Update the map immediately
			if (mapRef.current) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);
			}

			// Recalculate distances after restoring the state
			recalculateDistances();

			// Update latest lat/lng
			const lastPoint = geojsonRef.current.features
				.filter((f) => f.geometry.type === "Point")
				.pop();
			if (lastPoint) {
				setLatestLatLng(lastPoint.geometry.coordinates);
			} else {
				setLatestLatLng(null);
			}
		}
	}, [saveState, restoreState, recalculateDistances]);

	const handleClear = useCallback(() => {
		const confirmDelete = window.confirm(
			__("Are you sure you want to delete the route?", "mmd")
		);

		if (confirmDelete) {
			// Clear the current route
			geojsonRef.current = { type: "FeatureCollection", features: [] };
			linestringRef.current = {
				type: "Feature",
				geometry: {
					type: "LineString",
					coordinates: [],
				},
			};
			if (mapRef.current) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);
			}

			// Reset distances and other state
			setFullDistance(0);
			setLastDistance(0);
			setLatestLatLng(null);
			setIsRouteClosed(false);

			// Clear undo/redo history
			historyRef.current = [];
			futureRef.current = [];
		}
	}, []);

	const zoomToBoundingBox = useCallback(() => {
		if (linestringRef.current.geometry.coordinates.length < 2) return;

		const bounds = new mapboxgl.LngLatBounds();
		linestringRef.current.geometry.coordinates.forEach((coord) => {
			bounds.extend(coord);
		});

		mapRef.current.fitBounds(bounds, {
			padding: { top: 50, bottom: 50, left: 50, right: 50 },
			duration: 1000,
			// maxZoom: 15,
		});
	}, []);

	const handleSaveRoute = () => {
		const routeData = {
			coordinates: geojsonRef.current.features
				.filter((feature) => feature.geometry.type === "Point")
				.map((feature) => feature.geometry.coordinates),
			linestring: linestringRef.current.geometry.coordinates,
			fullDistance: rawFullDistance, // Use the raw distance in km
			units: units,
			bounds: mapRef.current.getBounds().toArray(), // This can be useful for initial view when loading
		};

		// Now you can pass this routeData to your SaveSharePopup component
		setRouteDataToSave(routeData);
		handleToggleSaveShare("save");
	};

	return (
		<>
			<MapBoxControls
				isRouteEditable={isRouteEditable}
				onToggleEditable={toggleRouteEditable}
				lastDistance={lastDistance.toFixed(2)}
				fullDistance={fullDistance.toFixed(2)}
				units={units}
				onUnitChange={handleUnitChange}
				onUndo={handleUndo}
				canUndo={historyRef.current.length > 0}
				onRedo={handleRedo}
				canRedo={futureRef.current.length > 0}
				onClear={handleClear}
				onSaveRoute={handleSaveRoute}
				canDeleteSave={historyRef.current.length > 0}
				latestLatLng={latestLatLng}
				onZoomToBounds={zoomToBoundingBox}
				canZoomToBounds={canZoomToBounds}
				centerOnNewMarker={centerOnNewMarker}
				onToggleCenterOnNewMarker={toggleCenterOnNewMarker}
				snapToRoutes={snapToRoutes}
				onSnapToggle={handleSnapToggle}
				onToggleSearch={handleToggleSearch}
				onToggleSaveShare={handleToggleSaveShare}
			/>
			<SearchPopup
				mapRef={mapRef}
				mapboxClient={mapboxClient}
				isOpen={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
			/>
			<SaveSharePopup
				mmdObj={mmdObj}
				isOpen={isSaveShareOpen}
				onClose={() => setIsSaveShareOpen(false)}
				userDetails={userDetails}
				action={saveShareAction}
				routeData={saveShareAction.routeData}
				distance={rawFullDistance}
			/>
			<ToastContainer
				position="bottom-center"
				autoClose={4000}
				icon={false}
				theme="dark"
				hideProgressBar={true}
				toastClassName="mmd-toast"
				closeButton={false}
				closeOnClick={true}
			/>
			{isLoading && (
				<div className="mmd-loading-route">
					<Loader />
				</div>
			)}
			<div
				id="mapbox-map"
				ref={mapContainerRef}
				style={{ width: "100%", height: "100%" }}
			/>
		</>
	);
};

export default MapBox;
