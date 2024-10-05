import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import Loader from "../../../Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MapRoutes = ({ mmdObj }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [deletingRouteId, setDeletingRouteId] = useState(null);
	const [savedRoutes, setSavedRoutes] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRoutes, setTotalRoutes] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const routesPerPage = 8;

	useEffect(() => {
		const fetchRoutes = async () => {
			setIsLoading(true);

			try {
				const response = await fetch(
					`${mmdObj.apiUrl}mmd-api/v1/get-user-routes/${mmdObj.userDetails.user_id}?page=${currentPage}&per_page=${routesPerPage}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"X-WP-Nonce": mmdObj.nonce,
						},
					}
				);
				if (response.ok) {
					const data = await response.json();

					if (data.success) {
						setSavedRoutes(data.routes);
						setTotalRoutes(data.total);
						setTotalPages(Math.ceil(data.total / routesPerPage));
					} else {
						toast.error("Failed to fetch routes");
						// throw new Error(data.message || "Failed to fetch routes");
					}
				} else {
					toast.error("Failed to fetch routes");
					// throw new Error("Failed to fetch routes");
				}
			} catch (error) {
				toast.error(
					<div>
						{__("No Routes Saved, ", "mmd")}
						<a href={mmdObj.siteUrl} className="mmd-toast-link">
							{__("Create one now!", "mmd")}
						</a>
					</div>,
					{
						autoClose: 6000,
						toastId: "no-routes-error",
					}
				);
				// console.error("Failed to fetch routes:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRoutes();
	}, [currentPage, mmdObj.apiUrl, mmdObj.userDetails.user_id, mmdObj.nonce]);

	const conversionFactors = {
		km: 1,
		mi: 0.621371,
		m: 1000,
		ft: 3280.84,
		yd: 1093.61,
		nm: 0.539957,
	};

	const convertDistance = (distanceInKm, toUnit) => {
		return distanceInKm * conversionFactors[toUnit];
	};

	const getUnitName = (unit) => {
		const unitNames = {
			km: "km",
			mi: "mi",
			m: "m",
			ft: "ft",
			yd: "yds",
			nm: "nm",
		};
		return unitNames[unit] || unit;
	};

	const parseRouteData = (data) => {
		if (typeof data === "string") {
			try {
				return JSON.parse(data);
			} catch (error) {
				console.error("Error parsing route data:", error);
				return {};
			}
		}
		return data || {};
	};

	const handleLoadRoute = (routeId) => {
		console.log('Loading Route... ', routeId);
	};

	const handleDeleteRoute = async (routeId) => {
		if (
			window.confirm(__("Are you sure you want to delete this route?", "mmd"))
		) {
			setDeletingRouteId(routeId);
			try {
				const response = await fetch(
					`${mmdObj.apiUrl}mmd-api/v1/delete-route/${routeId}`,
					{
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
							"X-WP-Nonce": mmdObj.nonce,
						},
					}
				);
				const data = await response.json();

				if (data.success) {
					toast.success(__("Route deleted successfully!", "mmd"));
					setSavedRoutes(
						savedRoutes.filter((route) => route.routeId !== routeId)
					);
				} else {
					toast.error(__("Failed to delete route. Please try again!", "mmd"));
				}
			} catch (error) {
				toast.error(
					__(
						"An error occurred while deleting the route. Please try again!",
						"mmd"
					)
				);
				console.error("Failed to delete route:", error);
			} finally {
				setTimeout(() => {
					setDeletingRouteId(null);
				}, 400);
			}
		}
	};

	const handlePageChange = (newPage) => {
		if (newPage > 0 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	return (
		<div className="mmd-routes">
			{isLoading ? (
				<div className="mmd-load-route">
					<Loader width={30} height={30} />
				</div>
			) : (
				<>
					{savedRoutes && savedRoutes.length > 0 ? (
						<div className="mmd-user-routes">
							{savedRoutes.map((route, index) => {
								const routeData = parseRouteData(route.routeData);
								const savedUnits = routeData.units || "km";
								const distanceInKm = parseFloat(route.routeDistance);
								const convertedDistance =
									savedUnits === "km"
										? distanceInKm
										: convertDistance(distanceInKm, savedUnits);

								return (
									<div
										key={route.routeId}
										className={`mmd-route ${
											index % 2 === 0 ? "alt-background" : ""
										}`}
									>
										{deletingRouteId === route.routeId && (
											<div className="route-loader">
												<Loader width={14} height={14} />
											</div>
										)}
										<h4 className="route-title">
											{route.routeName}
											<span
												className={`route-assosiation fa-solid ${
													route.collaborators > 0 ? "fa-users" : "fa-user"
												}`}
												title={
													route.collaborators > 0
														? __("Collaborated Route", "mmd")
														: __("Private Route", "mmd")
												}
											></span>
										</h4>
										<div className="route-distance">
											{convertedDistance.toFixed(2)} {getUnitName(savedUnits)}
										</div>
										<div className="route-controls">
											<span
												className="fa-solid fa-eye mmd-route-icon copy"
												onClick={() => handleLoadRoute(route.routeId)}
												title={__("View Route", "mmd")}
											></span>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<p className="mmd-no-routes">
							{__("No routes found.", "mmd")}{" "}
							<a href={mmdObj.siteUrl}>
								{__("Create your first route", "mmd")}
							</a>
						</p>
					)}
				</>
			)}

			{totalPages > 1 && (
				<div className="mmd-route-pagination">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						className="route-pagination-btn prev"
						disabled={currentPage === 1}
					>
						{__("Previous", "mmd")}
					</button>
					<span className="route-pagination-no">{`${__(
						"Page",
						"mmd"
					)} ${currentPage} ${__("of", "mmd")} ${totalPages}`}</span>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						className="route-pagination-btn next"
						disabled={currentPage === totalPages}
					>
						{__("Next", "mmd")}
					</button>
				</div>
			)}
		</div>
	);
};

export default MapRoutes;
