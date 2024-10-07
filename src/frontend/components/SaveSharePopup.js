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
	routeDistance,
	onSaveSuccess,
	isSaved,
	allowRouteEditing,
	setAllowRouteEditing,
	zoomToBoundingBox,
	isFormModified,
	setIsFormModified,
}) => {
	const [activeTab, setActiveTab] = useState(action);
	const [routeName, setRouteName] = useState("");
	const [routeDescription, setRouteDescription] = useState("");
	const [routeTags, setRouteTags] = useState([]);
	const [routeActivity, setRouteActivity] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [routeUrl, setRouteUrl] = useState("");
	const scrollableRef = useRef(null);
	const [hasSavedRoute, setHasSavedRoute] = useState(false); // NOT SURE THIS IS WORKING / NEEDED
	const [isEditable, setIsEditable] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [existingRouteId, setExistingRouteId] = useState(null);

	const activities = userDetails?.activities || [];

	// const [isSharedRoute, setIsSharedRoute] = useState(false);
	const [isRouteOwner, setIsRouteOwner] = useState(false);

	// console.log("routeData: ", routeData);

	useEffect(() => {
		setActiveTab(action);
	}, [action]);

	useEffect(() => {
		if (isOpen) {
			// Trigger zoom to bounds when popup is opened
			zoomToBoundingBox();

			if (routeData) {
				setRouteName(routeData.routeName || "");
				setRouteDescription(routeData.routeDescription || "");
				setRouteTags(routeData.routeTags || []);
				setRouteActivity(routeData.routeActivity || "");
				setIsEditable(false);
				setAllowRouteEditing(routeData.routeData?.allowRouteEditing || false);
				setExistingRouteId(routeData.routeId || null);
				setIsRouteOwner(routeData?.isRouteOwner || false);
				setIsEditing(!!routeData.routeId);
				setRouteUrl(
					routeData.routeId
					? `${mmdObj.siteUrl}/?route=${routeData.routeId}`
					: ""
				);
				// setIsSharedRoute();
			} else {
				// Reset form for new route
				setRouteName("");
				setRouteDescription("");
				setRouteTags([]);
				setRouteActivity("");
				setIsEditable(false);
				setAllowRouteEditing(false);
				setExistingRouteId(null);
				setIsRouteOwner(true);
				setIsEditing(false);
				setRouteUrl("");
				// setIsSharedRoute(false);
			}
		}
	}, [isOpen, routeData, userDetails, setAllowRouteEditing, mmdObj.siteUrl]);

	if (!isOpen) return null;

	console.log('routeData', routeData);
	// console.log('isSharedRoute', isSharedRoute);
	console.log('isRouteOwner', isRouteOwner);
	console.log('isSaved', isSaved);

	const handleTabClick = (tab) => {
		setActiveTab(tab);
	};

	const saveRoute = async (e, formData, saveAsNew = false) => {
		e.preventDefault();
		setIsLoading(true);

		if (!routeData) {
			console.error("No route data available to save");
			setIsLoading(false);
			return;
		}

		let endpoint;
		let method;

		if (saveAsNew || !isSaved) {
			// Save as a new route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/save-route`;
			method = "POST";
		} else {
			// Update the existing route
			endpoint = `${mmdObj.apiUrl}mmd-api/v1/update-route/${existingRouteId}`;
			method = "PUT";
		}

		const submittedRouteData = {
			routeName: formData.routeName,
			routeDescription: formData.routeDescription,
			routeTags: formData.routeTags,
			routeActivity: formData.routeActivity,
			routeDistance: routeDistance,
			routeData: {
				...routeData.routeData,
				allowRouteEditing: saveAsNew ? false : formData.allowRouteEditing,
			},
		};

		// console.log("submittedRouteData", submittedRouteData);

		try {
			const response = await fetch(endpoint, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					"X-WP-Nonce": mmdObj.nonce,
				},
				body: JSON.stringify(submittedRouteData),
			});

			if (!response.ok) {
				throw new Error("Failed to save/update route");
			}

			const data = await response.json();

			setIsFormModified(false);
			onSaveSuccess(data.route);
			setIsRouteOwner(data.route.isRouteOwner);

			setIsLoading(false);

			const newRouteUrl = `${mmdObj.siteUrl}/?route=${data.route.routeId}`;
			setRouteUrl(newRouteUrl);

			setHasSavedRoute(true);
			setExistingRouteId(data.route.routeId);
			setActiveTab("share");

			// Update the URL in the browser
			window.history.pushState({}, "", newRouteUrl);

			// Scroll to top of the popup
			if (scrollableRef.current) {
				scrollableRef.current.scrollTop = 0;
			}

			const successMessage = isEditing
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
			if (newTag && !routeTags.includes(newTag)) {
				setRouteTags([...routeTags, newTag]);
				e.target.value = "";
			}
		}
	};

	const removeTag = (indexToRemove) => {
		setRouteTags(routeTags.filter((_, index) => index !== indexToRemove));
	};

	const handleFormChange = () => {
		setIsFormModified(true);
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
										routeDescription={routeDescription}
										setRouteDescription={setRouteDescription}
										routeTags={routeTags}
										routeActivity={routeActivity}
										setRouteActivity={setRouteActivity}
										activities={activities}
										handleTagKeyDown={handleTagKeyDown}
										removeTag={removeTag}
										onSubmit={saveRoute}
										allowRouteEditing={allowRouteEditing}
										setAllowRouteEditing={setAllowRouteEditing}
										isEditing={isEditing}
										isRouteOwner={isRouteOwner}
										isSaved={isSaved}
										isFormModified={isFormModified}
										setIsFormModified={setIsFormModified}
										// isSharedRoute={isSharedRoute}
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
