import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";
import ShareButtons from "./ShareButtons";
import Loader from "../../Loader";
import SaveEditForm from "./SaveEditForm";

const SaveSharePopup = ({
	mmdObj,
	isPremiumUser,
	isOpen,
	onClose,
	userDetails,
	action,
	routeData,
	distance,
	onSaveSuccess,
	isSaved,
	allowRouteEditing,
	setAllowRouteEditing,
	zoomToBoundingBox,
}) => {
	const [activeTab, setActiveTab] = useState(action);
	const [routeName, setRouteName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState([]);
	const [activity, setActivity] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [routeUrl, setRouteUrl] = useState("");
	const scrollableRef = useRef(null);
	const [hasSavedRoute, setHasSavedRoute] = useState(false);
	const [isEditable, setIsEditable] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [existingRouteId, setExistingRouteId] = useState(null);

	const activities = userDetails?.activities || [];

	const [isSharedRoute, setIsSharedRoute] = useState(false);
	const [originalCreator, setOriginalCreator] = useState(null);

	useEffect(() => {
		setActiveTab(action);
	}, [action]);

	useEffect(() => {
		if (isOpen) {
			// Trigger zoom to bounds when popup is opened
			zoomToBoundingBox();

			if (routeData) {
				// Populate form with existing route data for editing
				setRouteName(routeData.routeName || "");
				setDescription(routeData.description || "");
				setTags(routeData.tags || []);
				setActivity(routeData.activity || "");
				setIsEditable(routeData.allowRouteEditing || false);
				setAllowRouteEditing(routeData.allowRouteEditing || false);
				setExistingRouteId(routeData.route_id || null);
				setIsSharedRoute(
					routeData.originalCreator &&
						routeData.originalCreator !== userDetails.id
				);
				setOriginalCreator(routeData.originalCreator || null);
				setIsEditing(!!routeData.route_id);
				setRouteUrl(
					routeData.routeUrl || `${mmdObj.siteUrl}/?route=${routeData.route_id}`
				);
			} else {
				// Reset form for new route
				setRouteName("");
				setDescription("");
				setTags([]);
				setActivity("");
				setIsEditable(false);
				setAllowRouteEditing(false);
				setExistingRouteId(null);
				setIsEditing(false);
				setIsSharedRoute(false);
				setOriginalCreator(null);
				setRouteUrl("");
			}
		}
	}, [isOpen, routeData, userDetails, setAllowRouteEditing, mmdObj.siteUrl]);

	if (!isOpen) return null;

	const handleTabClick = (tab) => {
		setActiveTab(tab);
	};

	const saveRoute = async (e, formData) => {
		e.preventDefault();
		setIsLoading(true);

		if (!routeData) {
			console.error("No route data available to save");
			setIsLoading(false);
			return;
		}

		let endpoint;
		let method;

		if (isSharedRoute && isEditable) {
			// Shared route that's editable - update the existing route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/update-route/${existingRouteId}`;
			method = "PUT";
		} else if (isSharedRoute && !isEditable) {
			// Shared route that's not editable - save as a new route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/save-route`;
			method = "POST";
		} else if (isEditing) {
			// Editing own route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/update-route/${existingRouteId}`;
			method = "PUT";
		} else {
			// New route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/save-route`;
			method = "POST";
		}

		try {
			const response = await fetch(endpoint, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					"X-WP-Nonce": mmdObj.nonce,
				},
				body: JSON.stringify({
					...formData,
					routeData: {
						...routeData,
						allowRouteEditing: formData.allowRouteEditing,
						pointsOfInterest: routeData.pointsOfInterest || [],
						originalCreator: isSharedRoute ? originalCreator : userDetails.id,
					},
					distance,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save/update route");
			}

			const data = await response.json();

			onSaveSuccess({
				...data,
				allowRouteEditing,
				pointsOfInterest: routeData.pointsOfInterest || [],
			});
			setIsLoading(false);

			const newRouteUrl = `${mmdObj.siteUrl}/?route=${data.route_id}`;
			setRouteUrl(newRouteUrl);

			setHasSavedRoute(true);
			setActiveTab("share");

			// Update the URL in the browser
			// window.history.pushState({}, "", newRouteUrl);

			// Scroll to top of the popup
			if (scrollableRef.current) {
				scrollableRef.current.scrollTop = 0;
			}

			const successMessage =
				isSharedRoute && !isEditable
					? __("Shared route saved as a new route!", "mmd")
					: isEditing
					? __("Route updated successfully!", "mmd")
					: __("Route saved successfully!", "mmd");

			toast.success(successMessage);
		} catch (error) {
			setIsLoading(false);
			toast.error(__("Failed to save/update route, please try again", "mmd"));
		}
	};

	const handleTagKeyDown = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const newTag = e.target.value.trim();
			if (newTag && !tags.includes(newTag)) {
				setTags([...tags, newTag]);
				e.target.value = "";
			}
		}
	};

	const removeTag = (indexToRemove) => {
		setTags(tags.filter((_, index) => index !== indexToRemove));
	};

	return (
		<>
			<div className="mmd-popup-bg" onClick={onClose}></div>
			<div className="mmd-popup">
				<div className="mmd-popup-inner saveshare" ref={scrollableRef}>
					{isLoading ? (
						<div className="mmd-load-route">
							<Loader loaderText={__("Saving...", "mmd")} />
						</div>
					) : (
						<>
							<ul className="mmd-tabs">
								<li
									className={`tab ${activeTab === "save" ? "active" : ""}`}
									onClick={() => handleTabClick("save")}
								>
									{__("Save", "mmd")}
								</li>
								<li
									className={`tab ${activeTab === "share" ? "active" : ""}`}
									onClick={() => handleTabClick("share")}
								>
									{__("Share", "mmd")}
								</li>
							</ul>
							<div className="mmd-contents">
								{activeTab === "save" && (
									<SaveEditForm
										isPremiumUser={isPremiumUser}
										routeName={routeName}
										setRouteName={setRouteName}
										description={description}
										setDescription={setDescription}
										tags={tags}
										activity={activity}
										setActivity={setActivity}
										activities={activities}
										handleTagKeyDown={handleTagKeyDown}
										removeTag={removeTag}
										onSubmit={saveRoute}
										allowRouteEditing={allowRouteEditing}
										setAllowRouteEditing={setAllowRouteEditing}
										isSharedRoute={isSharedRoute}
										isEditing={isEditing}
									/>
								)}
								{activeTab === "share" && (
									<div className="content share">
										<h3>{__("Share your route on:", "mmd")}</h3>
										<p>
											{__(
												"Share your route to inspire others, challenge friends, and connect with a like-minded community. It's a great way to turn your journey into a shared experience.",
												"mmd"
											)}
										</p>
										{isSaved ? (
											<ShareButtons routeUrl={routeUrl} />
										) : (
											<div className="mmd-share-tosave">
												<p>
													{__("Please save the route before sharing.", "mmd")}
												</p>
												<button onClick={() => handleTabClick("save")}>
													{__("Save Route", "mmd")}
												</button>
											</div>
										)}
									</div>
								)}
							</div>
						</>
					)}
				</div>
				<button
					onClick={onClose}
					className="mmd-popup-close fa-solid fa-xmark"
				></button>
			</div>
		</>
	);
};

export default SaveSharePopup;
