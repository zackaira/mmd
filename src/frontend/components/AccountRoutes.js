import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import Loader from "../../Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AccountRoutes = ({ mmdObj }) => {
	const apiUrl = mmdObj.apiUrl;
	const userDetails = mmdObj.userDetails;
	const [isLoading, setIsLoading] = useState(true);
	const [deletingRouteId, setDeletingRouteId] = useState(null);
	const [savedRoutes, setSavedRoutes] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const routesPerPage = 15;

	useEffect(() => {
		const fetchRoutes = async () => {
			setIsLoading(true);

			try {
				const response = await fetch(
					`${apiUrl}mmd-api/v1/get-user-routes/${userDetails.user_id}?page=${currentPage}&per_page=${routesPerPage}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"X-WP-Nonce": mmdObj.nonce,
						},
					}
				);
				const data = await response.json();

				if (data.success) {
					setSavedRoutes(data.routes);
					const total = data.total ? parseInt(data.total, 10) : 0;
					setTotalPages(total > 0 ? Math.ceil(total / routesPerPage) : 0);
				}
			} catch (error) {
				console.error("Failed to fetch routes:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRoutes();
	}, [currentPage, mmdObj.restUrl, mmdObj.userId]);

	const handleCopyRouteUrl = (routeId) => {
		const routeUrl = `${mmdObj.siteUrl}?route=${routeId}`;
		navigator.clipboard.writeText(routeUrl).then(
			() => {
				toast.success(__("Route URL copied to clipboard!", "mmd"));
			},
			(err) => {
				toast.error(
					__("Could not copy for some reason, Please try again!", "mmd")
				);
			}
		);
	};

	const handleDeleteRoute = async (routeId) => {
		if (
			window.confirm(__("Are you sure you want to delete this route?", "mmd"))
		) {
			setDeletingRouteId(routeId);
			try {
				const response = await fetch(
					`${apiUrl}mmd-api/v1/delete-route/${routeId}`,
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
					setSavedRoutes(savedRoutes.filter((route) => route.id !== routeId));
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
			<h3>{__("Saved Routes", "mmd")}</h3>
			{isLoading ? (
				<div className="mmd-load-route">
					<Loader />
				</div>
			) : (
				<>
					{savedRoutes && savedRoutes.length > 0 ? (
						<div className="mmd-user-routes">
							<div className="mmd-route th">
								<div className="route-title">{__("Route Name", "mmd")}</div>
								<p className="route-desc">{__("Description", "mmd")}</p>
								<div className="route-distance">{__("Distance", "mmd")}</div>
								<div className="route-date">{__("Created On", "mmd")}</div>
								<div className="route-controls"></div>
							</div>
							{savedRoutes.map((route, index) => (
								<div
									key={route.id}
									className={`mmd-route ${
										index % 2 === 0 ? "alt-background" : ""
									}`}
								>
									{deletingRouteId === route.id && (
										<div className="route-loader">
											<Loader width={20} height={20} />
										</div>
									)}
									<h4 className="route-title">{route.route_name}</h4>
									<p className="route-desc">{route.route_description}</p>
									<div className="route-distance">
										{parseFloat(route.distance).toFixed(2)}
									</div>
									<div className="route-date">
										{new Date(route.created_at).toLocaleDateString()}
									</div>
									<div className="route-controls">
										<span
											className="fa-solid fa-copy mmd-route-icon copy"
											onClick={() => handleCopyRouteUrl(route.id)}
										></span>
										<span className="fa-solid fa-edit mmd-route-icon edit"></span>
										<span
											className="fa-solid fa-trash-can mmd-route-icon delete"
											onClick={() => handleDeleteRoute(route.id)}
										></span>
									</div>
								</div>
							))}

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
		</div>
	);
};

export default AccountRoutes;
