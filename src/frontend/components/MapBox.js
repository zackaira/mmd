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
import Cookies from "js-cookie";

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
	const [allowRouteEditing, setAllowRouteEditing] = useState(false);

	const [userDetails, setUserDetails] = useState(mmdObj?.userDetails || null);
	const [isSaved, setIsSaved] = useState(false);

	const [rawLastDistance, setRawLastDistance] = useState(0);
	const [rawFullDistance, setRawFullDistance] = useState(0);
	const [lastDistance, setLastDistance] = useState(0);
	const [fullDistance, setFullDistance] = useState(0);
	const [units, setUnits] = useState(mmdObj?.userDetails?.units || "km");
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

	const [mapInitialized, setMapInitialized] = useState(false);
	const routeLoadingRef = useRef(false);

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isSaveShareOpen, setIsSaveShareOpen] = useState(false);
	const [saveShareAction, setSaveShareAction] = useState({
		action: "save",
		routeData: null,
	});
	const [loadedRouteData, setLoadedRouteData] = useState(null);

	useEffect(() => {
		if (!mapInitialized) return;

		const loadRouteFromCookie = () => {
			const savedRoute = Cookies.get("mmd_saved_route");
			if (savedRoute) {
				try {
					const routeData = JSON.parse(savedRoute);
					loadSavedRoute(routeData, true);
					Cookies.remove("mmd_saved_route");
				} catch (error) {
					console.error("Error loading saved route:", error);
				}
			}
		};

		if (mmdObj.routeId) {
			loadSavedRoute(mmdObj.routeId, false);
		} else if (userDetails) {
			loadRouteFromCookie();
		}
	}, [mapInitialized, mmdObj.routeId, userDetails, loadSavedRoute]);

	useEffect(() => {
		const routeId = mmdObj.routeId;
		if (routeId && !mapRef.current) {
			loadSavedRoute(routeId);
		}
	}, [mmdObj.routeId]);

	const loadSavedRoute = useCallback(
		(routeIdOrData, isFromCookie = false, retryCount = 0) => {
			if (routeLoadingRef.current) return;
			routeLoadingRef.current = true;
			setIsLoading(true);

			const processRouteData = (routeData) => {
				// Ensure coordinates and linestring are arrays, even if empty
				const coordinates = Array.isArray(routeData.coordinates)
					? routeData.coordinates
					: [];
				const linestring = Array.isArray(routeData.linestring)
					? routeData.linestring
					: [];

				// Update geojsonRef with the loaded data
				geojsonRef.current = {
					type: "FeatureCollection",
					features: [
						...coordinates.map((coord, index) => ({
							type: "Feature",
							geometry: {
								type: "Point",
								coordinates: coord,
							},
							properties: {
								markerNumber: index + 1,
								size: 8,
								color: [0, 0, 0, 1], // RGBA values
							},
						})),
						{
							type: "Feature",
							geometry: {
								type: "LineString",
								coordinates: linestring,
							},
							properties: {
								width: 2,
								color: [0, 0, 0, 1], // RGBA values
							},
						},
					],
				};

				// Update linestringRef
				linestringRef.current = {
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: linestring,
					},
					properties: {
						width: 2,
						color: [0, 0, 0, 1], // RGBA values
					},
				};

				const newAllowRouteEditing = isFromCookie
					? true
					: routeData.allowRouteEditing ?? false;

				setAllowRouteEditing(newAllowRouteEditing);

				const newIsRouteEditable = isFromCookie ? true : false;
				setIsRouteEditable(newIsRouteEditable);

				// Update state
				setRawFullDistance(routeData.fullDistance || 0);
				setUnits(routeData.units || "km");
				setIsSaved(!isFromCookie);

				// Update the map
				if (mapRef.current && mapRef.current.getSource("geojson")) {
					mapRef.current.getSource("geojson").setData(geojsonRef.current);
				}

				// Fit the map to the route bounds
				if (
					mapRef.current &&
					routeData.bounds &&
					Array.isArray(routeData.bounds) &&
					routeData.bounds.length === 2
				) {
					mapRef.current.fitBounds(routeData.bounds, {
						padding: { top: 50, bottom: 50, left: 50, right: 50 },
						duration: 1000,
					});
				} else {
					// If bounds are not available or invalid, fit to the linestring
					if (linestring.length > 0) {
						const bounds = new mapboxgl.LngLatBounds();
						linestring.forEach((coord) => bounds.extend(coord));
						mapRef.current.fitBounds(bounds, {
							padding: { top: 50, bottom: 50, left: 50, right: 50 },
							duration: 1000,
						});
					}
				}

				// Recalculate distances
				recalculateDistances();

				// Update click handlers
				if (mapRef.current) {
					if (isFromCookie) {
						mapRef.current.on("click", handleMapClick);
					} else {
						mapRef.current.off("click", handleMapClick);
					}
				}

				toast.success(
					isFromCookie
						? __("Unsaved route loaded successfully!", "mmd")
						: __("Saved route loaded successfully!", "mmd"),
					{ toastId: "route-loaded" }
				);

				routeLoadingRef.current = false;
				setIsLoading(false);
			};

			if (typeof routeIdOrData === "string" && !isFromCookie) {
				fetch(`${mmdObj.apiUrl}mmd-api/v1/get-route/${routeIdOrData}`, {
					headers: { "X-WP-Nonce": mmdObj.nonce },
				})
					.then((response) => response.json())
					.then((data) => {
						if (data.success) {
							processRouteData(data.route);
							setLoadedRouteData(data.route);
						} else {
							throw new Error(data.message || "Failed to load route");
						}
					})
					.catch((error) => {
						console.error("Error loading route:", error);
						if (retryCount < 3) {
							setTimeout(() => {
								loadSavedRoute(routeIdOrData, isFromCookie, retryCount + 1);
							}, 1000); // Wait 1 second before retrying
						} else {
							toast.error(__("Failed to load route. Please try again.", "mmd"));
						}
					})
					.finally(() => {
						routeLoadingRef.current = false;
						setIsLoading(false);
						setTimeout(() => zoomToBoundingBox(), 300);
					});
			} else if (isFromCookie) {
				processRouteData(routeIdOrData);
			} else {
				console.error("Invalid route data or ID:", routeIdOrData);
				toast.error(__("Invalid route data. Please try again.", "mmd"));
				routeLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[mmdObj.apiUrl, mmdObj.nonce, handleMapClick, recalculateDistances]
	);

	const saveRouteToCookie = useCallback(() => {
		const routeData = {
			coordinates: geojsonRef.current.features
				.filter((feature) => feature.geometry.type === "Point")
				.map((feature) => feature.geometry.coordinates),
			linestring: linestringRef.current.geometry.coordinates,
			fullDistance: rawFullDistance,
			units: units,
			bounds: mapRef.current.getBounds().toArray(),
		};
		Cookies.set("mmd_saved_route", JSON.stringify(routeData), { expires: 1 }); // Expires in 1 day
	}, [geojsonRef, linestringRef, rawFullDistance, units]);

	const toggleRouteEditable = useCallback(() => {
		console.log(
			"toggleRouteEditable called - current allowRouteEditing:",
			allowRouteEditing
		);
		if (allowRouteEditing) {
			setIsRouteEditable((prev) => {
				const newValue = !prev;
				console.log("toggleRouteEditable - new isRouteEditable:", newValue);
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
		} else {
			console.log("toggleRouteEditable - route is not allowed to be edited");
			toast.error(__("This route is not editable.", "mmd"), {
				toastId: "route-not-editable",
			});
		}
	}, [allowRouteEditing, handleMapClick]);

	const updateMapWithRouteData = useCallback(
		(routeData) => {
			setIsRouteEditable(false);

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

			setRawFullDistance(routeData.fullDistance);
			setUnits(routeData.units);

			if (routeData.coordinates.length > 0) {
				setLatestLatLng(
					routeData.coordinates[routeData.coordinates.length - 1]
				);
			}

			recalculateDistances();

			if (mapRef.current && mapRef.current.getSource("geojson")) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);
			}
		},
		[recalculateDistances]
	);

	const forceZoomToBounds = useCallback(() => {
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
	}, []);

	const handleToggleSearch = useCallback(() => {
		setIsSearchOpen((prev) => !prev);
	}, []);

	const handleToggleSaveShare = useCallback(
		(action) => {
			if (!userDetails) {
				saveRouteToCookie();
				showLoginRegisterToast();
				return;
			}

			const routeData = {
				coordinates: geojsonRef.current.features
					.filter((feature) => feature.geometry.type === "Point")
					.map((feature) => feature.geometry.coordinates),
				linestring: linestringRef.current.geometry.coordinates,
				fullDistance: rawFullDistance,
				units: units,
				bounds: mapRef.current.getBounds().toArray(),
				allowRouteEditing: allowRouteEditing,
			};

			setSaveShareAction({ action, routeData });
			setIsSaveShareOpen(true);
		},
		[
			geojsonRef,
			linestringRef,
			rawFullDistance,
			units,
			userDetails,
			saveRouteToCookie,
			showLoginRegisterToast,
		]
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
					"line-color": ["coalesce", ["get", "color"], "#000000"],
					"line-width": ["coalesce", ["get", "width"], 2],
				},
				filter: ["==", "$type", "LineString"],
			});

			map.addLayer({
				id: "measure-points",
				type: "circle",
				source: "geojson",
				paint: {
					"circle-radius": ["coalesce", ["get", "size"], 8],
					"circle-color": [
						"case",
						[
							"all",
							["==", ["get", "markerNumber"], 1],
							["==", ["to-boolean", ["get", "isRouteClosed"]], false],
							[">=", ["coalesce", ["get", "totalMarkers"], 0], 2],
						],
						"#2e9632",
						["==", ["get", "markerNumber"], 1],
						"#000000",
						"#000000",
					],
				},
				filter: ["==", "$type", "Point"],
			});

			map.addLayer({
				id: "measure-points-number",
				type: "symbol",
				source: "geojson",
				layout: {
					"text-field": ["coalesce", ["get", "markerNumber"], ""],
					"text-font": ["Open Sans Bold"],
					"text-size": 9,
					"text-allow-overlap": true,
				},
				paint: {
					"text-color": "#ffffff",
				},
				filter: ["==", "$type", "Point"],
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

			setMapInitialized(true);
		});

		return () => map.remove();
	}, [userLocation]);

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

				if (!userDetails) {
					saveRouteToCookie(); // Save route to cookie after each change
					if (markerCount === 1) {
						showLoginRegisterToast();
					}
				}
			}

			// Update the map
			map.getSource("geojson").setData(geojsonRef.current);
			setLatestLatLng(newPoint);
		},
		[
			isRouteEditable,
			saveState,
			updateRoute,
			isRouteClosed,
			showLoginRegisterToast,
			saveRouteToCookie,
			userDetails,
		]
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
			setIsRouteEditable(true);

			// Clear undo/redo history
			historyRef.current = [];
			futureRef.current = [];

			// Remove the route parameter from the URL
			const url = new URL(window.location.href);
			if (url.searchParams.has("route")) {
				url.searchParams.delete("route");
				window.history.replaceState({}, "", url.toString());
			}
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
			bounds: mapRef.current.getBounds().toArray(),
			allowRouteEditing: allowRouteEditing,
		};

		// Now you can pass this routeData to your SaveSharePopup component
		setRouteDataToSave(routeData);
		handleToggleSaveShare("save");
	};

	const handleSaveSuccess = useCallback((savedRouteData) => {
		setIsSaved(true);
		// Update allowRouteEditing based on the saved data
		const newAllowRouteEditing = savedRouteData.allowRouteEditing || false;
		setAllowRouteEditing(newAllowRouteEditing);
	}, []);

	const showLoginRegisterToast = useCallback(() => {
		toast.info(
			<div>
				{__(
					"You need to login to Save and Share routes. We'll save your route for when you come back here.",
					"mmd"
				)}
				<br />
				<a href={`${mmdObj.siteUrl}/account/?user=login`}>
					{__("Login", "mmd")}
				</a>
				{" | "}
				<a href={`${mmdObj.siteUrl}/account/?user=register`}>
					{__("Register", "mmd")}
				</a>
			</div>,
			{
				autoClose: 10000,
				toastId: "login-register-toast",
			}
		);
	}, [mmdObj.siteUrl]);

	return (
		<>
			<MapBoxControls
				isRouteEditable={isRouteEditable}
				allowRouteEditing={allowRouteEditing}
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
				isSaved={isSaved}
				routeData={loadedRouteData}
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
				action={saveShareAction.action}
				routeData={saveShareAction.routeData}
				distance={rawFullDistance}
				onSaveSuccess={handleSaveSuccess}
				isSaved={isSaved}
				allowRouteEditing={allowRouteEditing}
				setAllowRouteEditing={setAllowRouteEditing}
			/>
			<ToastContainer
				position="bottom-center"
				autoClose={4000}
				icon={false}
				theme="dark"
				hideProgressBar={true}
				toastClassName="mmd-toast"
				closeButton={true}
				closeOnClick={false}
			/>
			{isLoading && (
				<div className="mmd-loading-route">
					<Loader hasBg={true} />
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
