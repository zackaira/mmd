import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
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
import PoiForm from "./PoiForm";
import { debounce, convertDistance } from "../../utils";
// import ElevationProfile from "./ElevationProfile";

mapboxgl.accessToken = process.env.MMD_MAPBOX_ACCESS_TOKEN;

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
	const [userLocation, setUserLocation] = useState(null);
	const [mapZoom, setMapZoom] = useState(16);
	const [currentMapStyle, setCurrentMapStyle] = useState(
		"mapbox://styles/mapbox/streets-v12"
	);

	const [isLoading, setIsLoading] = useState(false);
	const [isNewRoute, setIsNewRoute] = useState(true);
	const [isRouteEditable, setIsRouteEditable] = useState(true);
	const [isRouteClosed, setIsRouteClosed] = useState(false);
	const [allowRouteEditing, setAllowRouteEditing] = useState(false);

	const [userDetails, setUserDetails] = useState(mmdObj?.userDetails || null);
	const [isPremiumUser, setIsPremiumUser] = useState(
		mmdObj?.userDetails?.isPremium || false
	);
	const [isSaved, setIsSaved] = useState(false);

	const [rawLastDistance, setRawLastDistance] = useState(0);
	const [rawFullDistance, setRawFullDistance] = useState(0);
	const [lastDistance, setLastDistance] = useState(0);
	const [fullDistance, setFullDistance] = useState(0);
	const [units, setUnits] = useState(mmdObj?.userDetails?.units || "km");
	const [latestLatLng, setLatestLatLng] = useState(null);
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
	const [saveShareAction, setSaveShareAction] = useState("save");
	const [loadedRouteData, setLoadedRouteData] = useState(null);

	const [sliderPosition, setSliderPosition] = useState(0);
	const currentPositionMarkerRef = useRef(null);
	const routeLengthRef = useRef(0);

	const [pointsOfInterest, setPointsOfInterest] = useState([]);
	const [editingPoi, setEditingPoi] = useState(null);
	const [arePoisVisible, setArePoisVisible] = useState(true);
	const [newPoiLocation, setNewPoiLocation] = useState(null);
	const [isPlacingPoi, setIsPlacingPoi] = useState(false);

	const poiMarkersRef = useRef({});
	const isNewRouteRef = useRef(isNewRoute);
	const isRouteEditableRef = useRef(isRouteEditable);
	const allowRouteEditingRef = useRef(allowRouteEditing);
	const [isFormModified, setIsFormModified] = useState(false);

	const [undoStack, setUndoStack] = useState([]);
	const [redoStack, setRedoStack] = useState([]);
	const isRouteClosedRef = useRef(isRouteClosed);
	const [wasRouteJustClosed, setWasRouteJustClosed] = useState(false);
	const markersRef = useRef([]);

	// Update refs when state changes
	useEffect(() => {
		isNewRouteRef.current = isNewRoute;
		isRouteEditableRef.current = isRouteEditable;
		allowRouteEditingRef.current = allowRouteEditing;
	}, [isNewRoute, isRouteEditable, allowRouteEditing]);

	useEffect(() => {
		isRouteClosedRef.current = isRouteClosed;
	}, [isRouteClosed]);

	useEffect(() => {
		markersRef.current = geojsonRef.current.features
			.filter((feature) => feature.geometry.type === "Point")
			.map((feature) => feature.geometry.coordinates);
	}, [geojsonRef.current.features]);

	useEffect(() => {
		if (!mapInitialized) return;

		if (mmdObj.routeId) {
			loadSavedRoute(mmdObj.routeId, false);
		} else if (userDetails) {
			loadRouteFromCookie();
		}
	}, [
		mapInitialized,
		mmdObj.routeId,
		userDetails,
		loadSavedRoute,
		loadRouteFromCookie,
	]);

	const loadRouteFromCookie = useCallback(() => {
		const savedRoute = Cookies.get("mmd_saved_route");
		if (savedRoute) {
			try {
				const routeData = JSON.parse(savedRoute);
				loadSavedRoute(routeData, true);

				// Restore the URL if it was a shared route
				if (routeData.url && routeData.url !== window.location.href) {
					window.history.replaceState({}, "", routeData.url);
				}

				// Update loadedRouteData with the full route information
				setLoadedRouteData({
					routeName: routeData.routeName,
					routeDescription: routeData.routeDescription,
					routeTags: routeData.routeTags,
					routeActivity: routeData.routeActivity,
					routeId: routeData.routeId,
					isRouteOwner: routeData.isRouteOwner,
					routeDistance: routeData.routeDistance,
					routeData: routeData.routeData,
				});

				Cookies.remove("mmd_saved_route");
			} catch (error) {
				console.error("Error loading saved route:", error);
			}
		}
	}, [loadSavedRoute, setLoadedRouteData]);

	useEffect(() => {
		if (mmdObj.routeId) {
			if (!mapRef.current) {
				loadSavedRoute(mmdObj.routeId, false);
			}
			setIsNewRouteAndRef(false);
		} else {
			setIsNewRouteAndRef(true);
		}
	}, [mmdObj.routeId, loadSavedRoute, setIsNewRouteAndRef]);

	const loadSavedRoute = useCallback(
		(routeIdOrData, isFromCookie = false) => {
			if (routeLoadingRef.current) return;
			routeLoadingRef.current = true;
			setIsRouteEditableAndRef(false);
			setIsLoading(true);

			const processRouteData = (routeData) => {
				// Ensure coordinates and linestring are arrays, even if empty
				const coordinates = Array.isArray(routeData.routeData.coordinates)
					? routeData.routeData.coordinates
					: [];
				const linestring = Array.isArray(routeData.routeData.linestring)
					? routeData.routeData.linestring
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

				setIsNewRouteAndRef(false);
				setIsRouteEditableAndRef(isFromCookie || false);
				setAllowRouteEditingAndRef(routeData.routeData.allowRouteEditing);

				setIsSaved(!isFromCookie);

				setRawFullDistance(routeData.routeDistance || 0);
				setUnits(routeData.routeData.units || "km");

				// Process Points of Interest
				setPointsOfInterest(routeData.routeData.pointsOfInterest || []);

				if (routeData.mapStyle) {
					handleMapStyleChange(routeData.mapStyle);
				}

				setLoadedRouteData({
					routeName: routeData.routeName || "",
					routeDescription: routeData.routeDescription || "",
					routeTags: routeData.routeTags || [],
					routeActivity: routeData.routeActivity || "",
					routeId: routeData.routeId || null,
					isRouteOwner: routeData.isRouteOwner || false,
					routeDistance: routeData.routeDistance || 0,
					routeData: routeData.routeData,
				});

				const loadedMarkers = routeData.routeData.coordinates || [];
				setUndoStack(loadedMarkers.slice(0, -1).reverse());
				setRedoStack([]);

				// Update the map when it's available
				if (mapRef.current && mapRef.current.getSource("geojson")) {
					mapRef.current.getSource("geojson").setData(geojsonRef.current);

					// Use setTimeout to ensure the map has updated before zooming
					setTimeout(() => {
						zoomToBoundingBox();
					}, 100);

					// Update click handlers
					if (isFromCookie) {
						mapRef.current.on("click", handleMapClick);
					} else {
						mapRef.current.off("click", handleMapClick);
					}
				}

				// Recalculate distances
				recalculateDistances();

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
						// console.error("Error loading route:", error);
						toast.error(__("Failed to load route. Please try again.", "mmd"));
					})
					.finally(() => {
						routeLoadingRef.current = false;
						setIsLoading(false);
					});
			} else if (isFromCookie) {
				processRouteData(routeIdOrData);
			} else {
				// console.error("Invalid route data or ID:", routeIdOrData);
				toast.error(__("Invalid route data. Please try again", "mmd"));
				routeLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[
			setIsNewRouteAndRef,
			setIsRouteEditableAndRef,
			setAllowRouteEditingAndRef,
			recalculateDistances,
			setIsLoading,
			setIsSaved,
			geojsonRef,
			linestringRef,
			mapRef,
			setRawFullDistance,
			setUnits,
			setPointsOfInterest,
			handleMapClick,
			mmdObj.apiUrl,
			mmdObj.nonce,
			setLoadedRouteData,
		]
	);

	const saveRouteToCookie = useCallback(() => {
		const routeData = {
			coordinates: geojsonRef.current.features
				.filter((feature) => feature.geometry.type === "Point")
				.map((feature) => feature.geometry.coordinates),
			linestring: linestringRef.current.geometry.coordinates,
			bounds: mapRef.current.getBounds().toArray(),
			allowRouteEditing: allowRouteEditing,
			pointsOfInterest: pointsOfInterest,
			units: units,
		};
		const cookieData = {
			routeDistance: rawFullDistance,
			routeData: routeData,
			routeName: loadedRouteData?.routeName || "",
			routeDescription: loadedRouteData?.routeDescription || "",
			routeTags: loadedRouteData?.routeTags || [],
			routeActivity: loadedRouteData?.routeActivity || "",
			routeId: loadedRouteData?.routeId || null,
			isRouteOwner: loadedRouteData?.isRouteOwner || false,
			url: window.location.href,
		};
		Cookies.set("mmd_saved_route", JSON.stringify(cookieData), { expires: 1 }); // Expires in 1 day
	}, [
		geojsonRef,
		linestringRef,
		rawFullDistance,
		units,
		allowRouteEditing,
		pointsOfInterest,
		loadedRouteData,
	]);

	const toggleRouteEditable = useCallback(() => {
		if (loadedRouteData.isRouteOwner || allowRouteEditingRef.current) {
			setIsRouteEditableAndRef((prev) => {
				const newValue = !prev;
				if (mapRef.current) {
					if (newValue) {
						mapRef.current.on("click", handleMapClick);
					} else {
						mapRef.current.off("click", handleMapClick);
					}
				}
				toast.success(
					newValue
						? __("Route is now editable", "mmd")
						: __("Route is no longer editable", "mmd"),
					{
						toastId: "is-route-editable",
					}
				);
				return newValue;
			});
		} else {
			toast.error(__("This route is not editable", "mmd"), {
				toastId: "is-route-editable",
			});
		}
	}, [setIsRouteEditableAndRef, handleMapClick, loadedRouteData]);

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
				routeDistance: rawFullDistance,
				routeData: {
					coordinates: geojsonRef.current.features
						.filter((feature) => feature.geometry.type === "Point")
						.map((feature) => feature.geometry.coordinates),
					linestring: linestringRef.current.geometry.coordinates,
					bounds: mapRef.current.getBounds().toArray(),
					allowRouteEditing: allowRouteEditing,
					pointsOfInterest: pointsOfInterest,
					units: units,
				},
				// Include additional fields from loadedRouteData if editing an existing route
				...(loadedRouteData && {
					routeName: loadedRouteData.routeName,
					routeDescription: loadedRouteData.routeDescription,
					routeTags: loadedRouteData.routeTags,
					routeActivity: loadedRouteData.routeActivity,
					routeId: loadedRouteData.routeId,
					...(loadedRouteData?.isRouteOwner && {
						isRouteOwner: loadedRouteData.isRouteOwner,
					}),
				}),
			};

			setLoadedRouteData(routeData);
			setSaveShareAction(action);
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
			pointsOfInterest,
			allowRouteEditing,
			loadedRouteData,
		]
	);

	const saveState = useCallback(() => {
		return {
			geojson: JSON.parse(JSON.stringify(geojsonRef.current)),
			linestring: JSON.parse(JSON.stringify(linestringRef.current)),
			isRouteClosed: isRouteClosed,
			pointsOfInterest: [...pointsOfInterest],
		};
	}, [isRouteClosed, pointsOfInterest]);

	const restoreState = useCallback((state) => {
		geojsonRef.current = state.geojson;
		linestringRef.current = state.linestring;
		setIsRouteClosed(state.isRouteClosed);
		setPointsOfInterest(state.pointsOfInterest || []);
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
					setMapZoom(16); // Zoom level for precise location
				},
				(error) => {
					// console.error("Error getting user location:", error);
					toast.error(
						<div>
							{__(
								"Error getting your location, find your localion manually, ",
								"mmd"
							)}
							<span className="mmd-toast-link" onClick={handleToggleSearch}>
								{__("Using Search", "mmd")}
							</span>
						</div>,
						{
							autoClose: 10000,
							toastId: "geolocation-error",
						}
					);
					setFallbackLocation();
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				}
			);
		} else {
			toast.error("Geolocation is not supported in your browser", {
				toastId: "geolocation-error",
			});
			setFallbackLocation();
		}
	}, [mmdObj.userDetails]);

	const setFallbackLocation = () => {
		const fallbackLocation = { coords: [25.0339, -29.0852], zoom: 5 };
		setUserLocation(fallbackLocation.coords);
		setMapZoom(fallbackLocation.zoom);
	};

	useEffect(() => {
		if (!userLocation || mapRef.current) return;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: currentMapStyle,
			center: userLocation,
			zoom: mapZoom,
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
			if (isPlacingPoi) {
				// Store the clicked location and open the PoiForm for input
				const clickedLocation = [e.lngLat.lng, e.lngLat.lat];
				setNewPoiLocation(clickedLocation);
				setEditingPoi({
					lngLat: clickedLocation, // Pass the location to the form
					title: "", // Placeholder, user will fill in
					description: "", // Placeholder
				});

				// Exit POI placement mode
				setIsPlacingPoi(false);
			} else if (isRouteEditable) {
				// Check if the click is on the current position marker or a POI marker
				if (
					e.originalEvent.target.classList.contains(
						"current-position-marker"
					) ||
					e.originalEvent.target.classList.contains("mmd-poi-marker") ||
					e.originalEvent.target.closest(".mapboxgl-popup")
				) {
					return; // Do nothing if clicked on current position marker, POI marker, or POI popup
				}

				const map = mapRef.current;
				if (!map) return;

				const features = map.queryRenderedFeatures(e.point, {
					layers: ["measure-points"],
				});

				const newPoint = [e.lngLat.lng, e.lngLat.lat];
				const markerCount = geojsonRef.current.features.filter(
					(feature) => feature.geometry.type === "Point"
				).length;

				// Save the current state to the undo stack before making changes
				setUndoStack((prevStack) => [...prevStack, saveState()]);

				if (
					features.length > 0 &&
					features[0].properties.markerNumber === 1 &&
					!isRouteClosed &&
					markerCount >= 3 // Only allow closing the route if there are 3 or more markers
				) {
					// Clicking on the first marker to close the route
					await updateRoute(newPoint, true);
					setIsRouteClosed(true); // Close the route
					setWasRouteJustClosed(true); // Track that the route was just closed

					toast.success("Route completed!", {
						toastId: "route-closed",
					});
				} else if (!features.length) {
					// Adding a new point
					await updateRoute(newPoint, false);
					setWasRouteJustClosed(false); // Reset closure state when adding a new point

					if (!userDetails) {
						saveRouteToCookie(); // Save route to cookie after each change
						if (markerCount === 1) {
							showLoginRegisterToast();
						}
					}
				}

				setRedoStack([]);

				// Update the map
				map.getSource("geojson").setData(geojsonRef.current);
				setLatestLatLng(newPoint);
			}
		},
		[
			isPlacingPoi,
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
			setIsFormModified(true);
		},
		[recalculateDistances, snapToRoutesRef]
	);

	useEffect(() => {
		if (mapRef.current) {
			if (isRouteEditable) {
				mapRef.current.on("click", handleMapClick);
			} else {
				mapRef.current.off("click", handleMapClick);
			}
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
		const lineStringCoords = linestringRef.current.geometry.coordinates;
		const markerFeatures = geojsonRef.current.features.filter(
			(feature) => feature.geometry.type === "Point"
		);

		// Calculate full distance
		if (lineStringCoords.length >= 2) {
			const route = turf.lineString(lineStringCoords);
			const totalDistanceKm = turf.length(route, { units: "kilometers" });
			setRawFullDistance(totalDistanceKm);

			// Convert full distance to selected units
			const fullDistanceConverted = convertDistance(
				totalDistanceKm,
				"km",
				units
			);
			setFullDistance(fullDistanceConverted);
		} else {
			setRawFullDistance(0);
			setFullDistance(0);
		}

		// Calculate last distance
		if (markerFeatures.length >= 2) {
			const lastMarkerIndex = markerFeatures.length - 1;
			const secondLastMarkerIndex = lastMarkerIndex - 1;

			const lastMarkerCoords =
				markerFeatures[lastMarkerIndex].geometry.coordinates;
			const secondLastMarkerCoords =
				markerFeatures[secondLastMarkerIndex].geometry.coordinates;

			// Find the closest points on the linestring to our markers
			const closestPointToLast = turf.nearestPointOnLine(
				turf.lineString(lineStringCoords),
				turf.point(lastMarkerCoords)
			);
			const closestPointToSecondLast = turf.nearestPointOnLine(
				turf.lineString(lineStringCoords),
				turf.point(secondLastMarkerCoords)
			);

			// Calculate the distance along the linestring between these two points
			const lastDistanceKm = Math.abs(
				closestPointToLast.properties.location -
					closestPointToSecondLast.properties.location
			);

			// Update rawLastDistance with the distance in kilometers
			setRawLastDistance(lastDistanceKm);
		} else if (markerFeatures.length === 1) {
			setRawLastDistance(0);
		} else {
			setRawLastDistance(0);
		}
	}, [units]);

	const updateRouteAfterUndo = useCallback(
		async (newMarkers) => {
			let updatedCoords = [];

			if (snapToRoutesRef.current && newMarkers.length > 1) {
				for (let i = 1; i < newMarkers.length; i++) {
					try {
						const response = await mapboxClient.current.directions
							.getDirections({
								profile: "walking",
								geometries: "geojson",
								waypoints: [
									{ coordinates: newMarkers[i - 1] },
									{ coordinates: newMarkers[i] },
								],
							})
							.send();

						const routeSegment = response.body.routes[0].geometry.coordinates;
						updatedCoords = updatedCoords.concat(
							i === 1 ? routeSegment : routeSegment.slice(1)
						);
					} catch (error) {
						console.error("Error fetching route:", error);
						updatedCoords.push(newMarkers[i]);
					}
				}
			} else {
				updatedCoords = newMarkers;
			}

			// Update geojsonRef with new markers
			geojsonRef.current.features = newMarkers.map((coord, index) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: coord,
				},
				properties: {
					markerNumber: index + 1,
					size: 8,
					color: [0, 0, 0, 1],
				},
			}));

			// Update linestring
			const newLineString = {
				type: "Feature",
				geometry: {
					type: "LineString",
					coordinates: updatedCoords,
				},
				properties: {
					width: 2,
					color: [0, 0, 0, 1],
				},
			};
			geojsonRef.current.features.push(newLineString);
			linestringRef.current = newLineString;

			// Update map
			if (mapRef.current && mapRef.current.getSource("geojson")) {
				mapRef.current.getSource("geojson").setData(geojsonRef.current);
			}

			// Update latest lat/lng
			if (newMarkers.length > 0) {
				setLatestLatLng(newMarkers[newMarkers.length - 1]);
			} else {
				setLatestLatLng(null);
			}

			// Update POIs
			updatePOIsAfterUndo(updatedCoords);

			// Recalculate distances
			recalculateDistances();
		},
		[
			recalculateDistances,
			setLatestLatLng,
			updatePOIsAfterUndo,
			snapToRoutesRef,
			mapboxClient,
		]
	);

	const handleUndo = useCallback(() => {
		const markers = markersRef.current; // Get the current markers from the ref

		if (markers.length > 1) {
			// If the route was just closed, undo the closure but keep the last marker intact
			if (wasRouteJustClosed) {
				setIsRouteClosed(false); // Reopen the route
				setWasRouteJustClosed(false); // Reset the flag
				setRedoStack((prevStack) => [
					...prevStack,
					markers[markers.length - 1],
				]); // Add the closing marker to the redo stack

				// No need to pop the last marker, just update the route without the closure
				updateRouteAfterUndo(markers);
			} else {
				// Normal undo behavior when the route isn't closed
				const lastMarker = markers.pop();
				setUndoStack((prevStack) => prevStack.slice(0, -1));
				setRedoStack((prevStack) => [...prevStack, lastMarker]);

				updateRouteAfterUndo(markers);
			}

			// Remove the current position marker if it exists
			if (currentPositionMarkerRef.current) {
				currentPositionMarkerRef.current.remove();
				currentPositionMarkerRef.current = null;
				setSliderPosition(0);
			}
		}
		setIsFormModified(true);
	}, [wasRouteJustClosed, updateRouteAfterUndo]);

	const handleRedo = useCallback(() => {
		const markers = markersRef.current;

		if (redoStack.length > 0) {
			const markerToRedo = redoStack[redoStack.length - 1];
			const newMarkers = [...markers, markerToRedo];

			setRedoStack((prevStack) => prevStack.slice(0, -1));
			setUndoStack((prevStack) => [...prevStack, markerToRedo]);

			// If the marker being redone is the one that closes the loop, re-close the route
			if (newMarkers.length >= 3 && markerToRedo === markers[0]) {
				setIsRouteClosed(true);
				setWasRouteJustClosed(true); // Set the flag to indicate the route was re-closed
			}

			updateRouteAfterUndo(newMarkers);
		}
		setIsFormModified(true);
	}, [redoStack, updateRouteAfterUndo]);

	const updatePOIsAfterUndo = useCallback((newMarkers) => {
		setPointsOfInterest((prevPois) => {
			return prevPois.filter((poi) => {
				const poiPoint = turf.point(poi.lngLat);
				const updatedLine = turf.lineString(newMarkers);
				const snappedPoint = turf.nearestPointOnLine(updatedLine, poiPoint);
				return turf.distance(poiPoint, snappedPoint, { units: "meters" }) < 10;
			});
		});
	}, []);

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

			setIsNewRouteAndRef(true);
			setIsRouteEditableAndRef(true);
			setAllowRouteEditingAndRef(true);
			setPointsOfInterest([]);

			// Clear undo/redo history
			historyRef.current = [];
			futureRef.current = [];

			// Remove the route parameter from the URL
			const url = new URL(window.location.href);
			if (url.searchParams.has("route")) {
				url.searchParams.delete("route");
				window.history.replaceState({}, "", url.toString());
			}

			// Clear current position marker
			if (currentPositionMarkerRef.current) {
				currentPositionMarkerRef.current.remove();
				currentPositionMarkerRef.current = null;
			}

			// Clear POIs
			setPointsOfInterest([]);
			Object.values(poiMarkersRef.current).forEach((marker) => marker.remove());
			poiMarkersRef.current = {};

			// Clear route info
			setLoadedRouteData(null);

			// Reset slider position
			setSliderPosition(0);

			// Reset raw distances
			setRawFullDistance(0);
			setRawLastDistance(0);

			// Clear any active editing POI
			setEditingPoi(null);

			// Reset isSaved state
			setIsSaved(false);

			toast.success(__("Route deleted successfully", "mmd"), {
				toastId: "route-deleted",
			});
		}
	}, [
		setIsNewRouteAndRef,
		setIsRouteEditableAndRef,
		setAllowRouteEditingAndRef,
	]);

	const zoomToBoundingBox = useCallback(() => {
		if (linestringRef.current.geometry.coordinates.length < 2) return;

		const bounds = new mapboxgl.LngLatBounds();
		linestringRef.current.geometry.coordinates.forEach((coord) => {
			bounds.extend(coord);
		});

		mapRef.current.fitBounds(bounds, {
			padding: { top: 50, bottom: 50, left: 50, right: 50 },
			duration: 1000,
			maxZoom: 15,
		});
	}, []);

	const handleSaveRoute = () => {
		const routeData = {
			routeDistance: rawFullDistance, // Use the raw distance in km
			routeData: {
				coordinates: geojsonRef.current.features
					.filter((feature) => feature.geometry.type === "Point")
					.map((feature) => feature.geometry.coordinates),
				linestring: linestringRef.current.geometry.coordinates,
				units: units,
				bounds: mapRef.current.getBounds().toArray(),
				allowRouteEditing: allowRouteEditing,
				pointsOfInterest: pointsOfInterest,
				mapStyle: currentMapStyle,
			},
		};

		// Now you can pass this routeData to your SaveSharePopup component
		setRouteDataToSave(routeData);
		handleToggleSaveShare("save");
	};

	const handleSaveSuccess = useCallback(
		(savedRouteData) => {
			setIsSaved(true);
			// Update allowRouteEditing based on the saved data
			const newAllowRouteEditing =
				savedRouteData.routeData.allowRouteEditing ?? false;
			setAllowRouteEditingAndRef(newAllowRouteEditing);
			setLoadedRouteData(savedRouteData);

			// Update other relevant state
			setRawFullDistance(savedRouteData.routeDistance);
			setUnits(savedRouteData.routeData.units);
			setPointsOfInterest(savedRouteData.routeData.pointsOfInterest);

			// Update geojsonRef and linestringRef if needed
			updateRouteRefs(savedRouteData.routeData);
		},
		[
			setAllowRouteEditingAndRef,
			setRawFullDistance,
			setUnits,
			setPointsOfInterest,
		]
	);

	// Helper function to update route refs
	const updateRouteRefs = (routeData) => {
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
						size: 8,
						color: [0, 0, 0, 1],
					},
				})),
				{
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: routeData.linestring,
					},
					properties: {
						width: 2,
						color: [0, 0, 0, 1],
					},
				},
			],
		};

		linestringRef.current = {
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: routeData.linestring,
			},
			properties: {
				width: 2,
				color: [0, 0, 0, 1],
			},
		};

		if (mapRef.current && mapRef.current.getSource("geojson")) {
			mapRef.current.getSource("geojson").setData(geojsonRef.current);
		}
	};

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

	/*
	 * Route Progress Slider
	 */
	useEffect(() => {
		if (linestringRef.current.geometry.coordinates.length > 1) {
			const route = turf.lineString(linestringRef.current.geometry.coordinates);
			routeLengthRef.current = turf.length(route, { units: "kilometers" });
		}
	}, [linestringRef.current.geometry.coordinates]);

	const handleSliderChange = useCallback(
		(position) => {
			setSliderPosition(position);

			if (linestringRef.current.geometry.coordinates.length < 2) return;

			const route = turf.lineString(linestringRef.current.geometry.coordinates);
			const totalLength = routeLengthRef.current;

			// Calculate the distance along the route based on slider position
			const distanceAlong = (position / 100) * totalLength;

			// Get the interpolated point along the route
			const currentPosition = turf.along(route, distanceAlong, {
				units: "kilometers",
			}).geometry.coordinates;

			// Update the "current position" marker on the map
			updateCurrentPositionMarker(currentPosition);

			// Only pan the map if centerOnNewMarker is true
			if (centerOnNewMarker && mapRef.current) {
				mapRef.current.panTo(currentPosition);
			}
		},
		[centerOnNewMarker]
	);

	/*
	 * Points of Interest
	 */
	const handleCurrentPositionMarkerClick = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();

			// Use the current state values instead of refs
			if (
				isPremiumUser &&
				(isNewRoute || (isRouteEditable && allowRouteEditing))
			) {
				const lngLat = currentPositionMarkerRef.current.getLngLat();
				setEditingPoi({ lngLat: [lngLat.lng, lngLat.lat] });
			} else {
				if (userDetails) {
					if (!isPremiumUser) {
						toast.info(__("Points of Interest are a Premium feature", "mmd"), {
							toastId: "premium-feature",
						});
					} else if (!isRouteEditable) {
						toast.info(__("The route is not currently editable", "mmd"), {
							toastId: "route-not-editable",
						});
					} else if (!allowRouteEditing) {
						toast.info(__("Editing is not allowed for this route", "mmd"), {
							toastId: "editing-not-allowed",
						});
					}
				} else {
					toast.info(__("Please Signup or Login to edit a route", "mmd"), {
						toastId: "login-required",
					});
				}
			}
		},
		[isPremiumUser, isNewRoute, isRouteEditable, allowRouteEditing, userDetails]
	);

	const updateCurrentPositionMarker = useCallback(
		(position) => {
			if (!mapRef.current) return;

			if (!currentPositionMarkerRef.current) {
				const el = document.createElement("div");
				el.className = "current-position-marker";
				currentPositionMarkerRef.current = new mapboxgl.Marker(el)
					.setLngLat(position)
					.addTo(mapRef.current);
			} else {
				currentPositionMarkerRef.current.setLngLat(position);
			}

			const markerElement = currentPositionMarkerRef.current.getElement();

			// Update the marker's appearance based on editability
			if (isNewRoute || (isRouteEditable && allowRouteEditing)) {
				markerElement.style.cursor = "pointer";
				markerElement.title = __("Click to add a point of interest", "mmd");
			} else {
				markerElement.style.cursor = "default";
				markerElement.title = __("This Route is not editable", "mmd");
			}

			// Always remove the old click listener
			markerElement.removeEventListener(
				"click",
				handleCurrentPositionMarkerClick
			);

			// Always add the click listener (the handler will check for editability)
			markerElement.addEventListener("click", handleCurrentPositionMarkerClick);
		},
		[
			handleCurrentPositionMarkerClick,
			isNewRoute,
			isRouteEditable,
			allowRouteEditing,
		]
	);

	// Update these functions to set both state and ref
	const setIsNewRouteAndRef = useCallback((value) => {
		setIsNewRoute(value);
		isNewRouteRef.current = value;
	}, []);

	const setIsRouteEditableAndRef = useCallback((value) => {
		setIsRouteEditable(value);
		isRouteEditableRef.current = value;
	}, []);

	const setAllowRouteEditingAndRef = useCallback((value) => {
		setAllowRouteEditing(value);
		allowRouteEditingRef.current = value;
	}, []);

	const handlePoiSave = useCallback(
		(poi) => {
			setPointsOfInterest((prevPois) => {
				if (poi.id) {
					// Update an existing POI
					return prevPois.map((p) =>
						p.id === poi.id
							? { ...poi, segmentIndex: getSegmentIndex(poi.lngLat) }
							: p
					);
				} else {
					// Add a new POI
					const newPoi = {
						...poi,
						lngLat: newPoiLocation, // Use the location where the user clicked on the map
						id: Date.now(), // Unique ID
						segmentIndex: getSegmentIndex(newPoiLocation),
					};
					return [...prevPois, newPoi];
				}
			});

			// Clear the form and the new POI location
			setEditingPoi(null);
			setNewPoiLocation(null);

			toast.success("Point of Interest added!");
		},
		[newPoiLocation, getSegmentIndex]
	);

	const getSegmentIndex = useCallback((poiCoords) => {
		if (!poiCoords || !Array.isArray(poiCoords) || poiCoords.length !== 2) {
			console.error("Invalid POI coordinates:", poiCoords);
			return -1; // or handle this case appropriately
		}

		const lineString = linestringRef.current.geometry.coordinates;
		let minDistance = Infinity;
		let segmentIndex = -1;

		for (let i = 0; i < lineString.length - 1; i++) {
			const start = turf.point(lineString[i]);
			const end = turf.point(lineString[i + 1]);
			const line = turf.lineString([lineString[i], lineString[i + 1]]);
			const point = turf.point(poiCoords);

			const snapped = turf.nearestPointOnLine(line, point);
			const distance = turf.distance(point, snapped);

			if (distance < minDistance) {
				minDistance = distance;
				segmentIndex = i;
			}
		}

		return segmentIndex;
	}, []);

	const handlePoiEdit = useCallback(
		(poi) => {
			setEditingPoi(poi);
		},
		[loadedRouteData]
	);

	const handlePoiDelete = useCallback((poiId) => {
		const confirmDelete = window.confirm(
			__("Are you sure you want to delete this Point of Interest?", "mmd")
		);

		if (confirmDelete) {
			setPointsOfInterest((prevPois) => prevPois.filter((p) => p.id !== poiId));
			if (poiMarkersRef.current[poiId]) {
				poiMarkersRef.current[poiId].remove();
				delete poiMarkersRef.current[poiId];
			}
		}
	}, []);

	const handlePoiClick = useCallback((poiId) => {
		if (poiMarkersRef.current[poiId]) {
			const marker = poiMarkersRef.current[poiId];
			marker.togglePopup();

			// Center the map on the clicked POI
			mapRef.current.flyTo({
				center: marker.getLngLat(),
				zoom: 15,
				duration: 1000,
			});
		}
	}, []);

	useEffect(() => {
		if (!mapRef.current) return;

		const addPOIMarkers = () => {
			// Remove existing POI markers
			Object.values(poiMarkersRef.current).forEach((marker) => marker.remove());
			poiMarkersRef.current = {};

			// Add new POI markers
			// Only add markers if POIs are visible
			if (arePoisVisible) {
				pointsOfInterest.forEach((poi) => {
					const el = document.createElement("div");
					el.className = "mmd-poi-marker";
					el.innerHTML = `<span class='poicon fa-solid ${
						poi.icon || "fa-location-dot"
					}'></span>`;
					el.title = poi.title;

					const popup = new mapboxgl.Popup({
						offset: 25,
						closeButton: false,
					}).setHTML(
						`<div class="mmd-poi-content">
							<button class="fa-solid fa-xmark mmd-poi-close" tabindex="-1"></button>

							<h3>${poi.title}</h3>
							<p>${poi.description}</p>
							${
								isPremiumUser && isRouteEditableRef.current
									? `
							<div class="mmd-poi-btns">
							<button class="poi-btn edit-poi" data-poi-id="${poi.id}">${__(
											"Edit",
											"mmd"
									  )}</button>
							<button class="poi-btn delete-poi" data-poi-id="${poi.id}">${__(
											"Delete",
											"mmd"
									  )}</button></div>`
									: ""
							}
						</div>`
					);

					const marker = new mapboxgl.Marker(el)
						.setLngLat(poi.lngLat)
						.setPopup(popup)
						.addTo(mapRef.current);

					poiMarkersRef.current[poi.id] = marker;

					marker.getElement().addEventListener("click", (e) => {
						e.stopPropagation(); // Prevent the click from propagating to the map
						marker.togglePopup();
					});

					// Add event listeners to edit and delete buttons after the popup is added to the DOM
					popup.on("open", () => {
						const popupContent = document.querySelector(".mmd-poi-content");
						if (popupContent) {
							const editButton = popupContent.querySelector(".edit-poi");
							const deleteButton = popupContent.querySelector(".delete-poi");
							const closeButton = popupContent.querySelector(".mmd-poi-close");

							closeButton.addEventListener("click", () => {
								document.querySelector(".mmd-poi-content").inert = true;
								marker.togglePopup();
							});

							if (editButton) {
								editButton.addEventListener("click", (e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePoiEdit(poi);
									// marker.togglePopup();
								});
							}

							if (deleteButton) {
								deleteButton.addEventListener("click", (e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePoiDelete(poi.id);
								});
							}
						}
					});
				});
			}
		};

		// Debounce the addPOIMarkers function
		const debouncedAddPOIMarkers = debounce(addPOIMarkers, 300);

		debouncedAddPOIMarkers();

		return () => {
			// Clean up markers when component unmounts or pointsOfInterest changes
			Object.values(poiMarkersRef.current).forEach((marker) => marker.remove());
		};
	}, [
		pointsOfInterest,
		loadedRouteData,
		isRouteEditable,
		allowRouteEditing,
		isNewRoute,
		userDetails,
		handlePoiEdit,
		handlePoiDelete,
		arePoisVisible,
	]);

	useEffect(() => {
		if (currentPositionMarkerRef.current) {
			const markerElement = currentPositionMarkerRef.current.getElement();

			markerElement.addEventListener("click", handleCurrentPositionMarkerClick);

			return () => {
				markerElement.removeEventListener(
					"click",
					handleCurrentPositionMarkerClick
				);
			};
		}
	}, [
		handleCurrentPositionMarkerClick,
		isNewRoute,
		isRouteEditable,
		allowRouteEditing,
	]);

	const togglePoiVisibility = useCallback(() => {
		setArePoisVisible((prevVisible) => !prevVisible);
	}, []);

	// const handleMapStyleChange = (newStyle) => {
	// 	if (mapRef.current) {
	// 		mapRef.current.once("style.load", () => {
	// 			// Re-add the custom source and layers
	// 			if (!mapRef.current.getSource("geojson")) {
	// 				mapRef.current.addSource("geojson", {
	// 					type: "geojson",
	// 					data: geojsonRef.current,
	// 				});
	// 			}

	// 			if (!mapRef.current.getLayer("measure-lines")) {
	// 				mapRef.current.addLayer({
	// 					id: "measure-lines",
	// 					type: "line",
	// 					source: "geojson",
	// 					layout: {
	// 						"line-cap": "round",
	// 						"line-join": "round",
	// 					},
	// 					paint: {
	// 						"line-color": ["coalesce", ["get", "color"], "#000000"],
	// 						"line-width": ["coalesce", ["get", "width"], 2],
	// 					},
	// 					filter: ["==", "$type", "LineString"],
	// 				});
	// 			}

	// 			if (!mapRef.current.getLayer("measure-points")) {
	// 				mapRef.current.addLayer({
	// 					id: "measure-points",
	// 					type: "circle",
	// 					source: "geojson",
	// 					paint: {
	// 						"circle-radius": ["coalesce", ["get", "size"], 8],
	// 						"circle-color": [
	// 							"case",
	// 							[
	// 								"all",
	// 								["==", ["get", "markerNumber"], 1],
	// 								["==", ["to-boolean", ["get", "isRouteClosed"]], false],
	// 								[">=", ["coalesce", ["get", "totalMarkers"], 0], 2],
	// 							],
	// 							"#2e9632",
	// 							["==", ["get", "markerNumber"], 1],
	// 							"#000000",
	// 							"#000000",
	// 						],
	// 					},
	// 					filter: ["==", "$type", "Point"],
	// 				});
	// 			}

	// 			if (!mapRef.current.getLayer("measure-points-number")) {
	// 				mapRef.current.addLayer({
	// 					id: "measure-points-number",
	// 					type: "symbol",
	// 					source: "geojson",
	// 					layout: {
	// 						"text-field": ["coalesce", ["get", "markerNumber"], ""],
	// 						"text-font": ["Open Sans Bold"],
	// 						"text-size": 9,
	// 						"text-allow-overlap": true,
	// 					},
	// 					paint: {
	// 						"text-color": "#ffffff",
	// 					},
	// 					filter: ["==", "$type", "Point"],
	// 				});
	// 			}

	// 			// Update the data
	// 			mapRef.current.getSource("geojson").setData(geojsonRef.current);

	// 			// Re-attach event listeners
	// 			if (isRouteEditable) {
	// 				mapRef.current.on("click", handleMapClick);
	// 			}

	// 			mapRef.current.on("mousemove", (e) => {
	// 				const features = mapRef.current.queryRenderedFeatures(e.point, {
	// 					layers: ["measure-points"],
	// 				});
	// 				mapRef.current.getCanvas().style.cursor = features.length
	// 					? "pointer"
	// 					: "crosshair";
	// 			});

	// 			// Re-add POI markers
	// 			addPOIMarkers();

	// 			// Re-add current position marker if it exists
	// 			if (currentPositionMarkerRef.current) {
	// 				currentPositionMarkerRef.current.addTo(mapRef.current);
	// 			}
	// 		});

	// 		mapRef.current.setStyle(newStyle);
	// 		setCurrentMapStyle(newStyle);
	// 	}
	// };

	return (
		<>
			<MapBoxControls
				userDetails={userDetails}
				isRouteEditable={isRouteEditable}
				allowRouteEditing={allowRouteEditing}
				onToggleEditable={toggleRouteEditable}
				lastDistance={lastDistance.toFixed(2)}
				fullDistance={fullDistance.toFixed(2)}
				units={units}
				onUnitChange={handleUnitChange}
				onUndo={handleUndo}
				canUndo={undoStack.length > 0} // historyRef.current.length > 0
				onRedo={handleRedo}
				canRedo={redoStack.length > 0} // futureRef.current.length > 0
				onClear={handleClear}
				onSaveRoute={handleSaveRoute}
				canDeleteSave={linestringRef.current.geometry.coordinates.length > 1}
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
				sliderPosition={sliderPosition}
				routeLength={
					linestringRef.current.geometry.coordinates.length > 1 ? 100 : 0
				}
				onSliderChange={handleSliderChange}
				pointsOfInterest={pointsOfInterest}
				arePoisVisible={arePoisVisible}
				onPoiClick={handlePoiClick}
				onTogglePoiVisibility={togglePoiVisibility}
				currentMapStyle={currentMapStyle}
				isPlacingPoi={isPlacingPoi}
				onAddPoi={() => setIsPlacingPoi(true)}
				// onMapStyleChange={handleMapStyleChange}
			/>
			{editingPoi && (
				<PoiForm
					poi={editingPoi}
					onSave={handlePoiSave}
					onCancel={() => {
						setEditingPoi(null);
						setNewPoiLocation(null);
					}}
					isPremiumUser={isPremiumUser}
				/>
			)}

			<SearchPopup
				mapRef={mapRef}
				mapboxClient={mapboxClient}
				isOpen={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
			/>
			<SaveSharePopup
				mmdObj={mmdObj}
				isPremiumUser={isPremiumUser}
				isOpen={isSaveShareOpen}
				onClose={() => setIsSaveShareOpen(false)}
				userDetails={userDetails}
				action={saveShareAction}
				routeData={loadedRouteData}
				routeDistance={rawFullDistance}
				onSaveSuccess={handleSaveSuccess}
				isSaved={isSaved}
				allowRouteEditing={allowRouteEditing}
				setAllowRouteEditing={setAllowRouteEditing}
				zoomToBoundingBox={zoomToBoundingBox}
				isFormModified={isFormModified}
				setIsFormModified={setIsFormModified}
			/>

			<ElevationProfile
				map={mapRef.current}
				coordinates={linestringRef.current.geometry.coordinates}
				units={units}
				onElevationCalculated={handleElevationCalculated}
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
