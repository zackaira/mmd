import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";
import ShareButtons from "./ShareButtons";
import Loader from "../../Loader";
import SaveEditForm from "./SaveEditForm";

const SaveSharePopup = ({
	mmdObj,
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

	const activities = userDetails?.activities || [];

	useEffect(() => {
		setActiveTab(action);
	}, [action]);

	useEffect(() => {
		if (isOpen || hasSavedRoute) {
			setRouteName("");
			setDescription("");
			setTags([]);
			setActivity("");
			setIsEditable(false);
			setAllowRouteEditing(false);

			if (hasSavedRoute) {
				setActiveTab("share");
				if (scrollableRef.current) {
					scrollableRef.current.scrollTop = 0;
				}
				setHasSavedRoute(false);
			} else {
				setActiveTab(action);
			}
		}
	}, [isOpen, action, hasSavedRoute]);

	if (!isOpen) return null;

	const handleTabClick = (tab) => {
		setActiveTab(tab);
	};

	const saveRoute = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		if (!routeData) {
			console.error("No route data available to save");
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch(`${mmdObj.apiUrl}mmd-api/v1/save-route`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-WP-Nonce": mmdObj.nonce,
				},
				body: JSON.stringify({
					routeName,
					description,
					tags,
					activity,
					routeData: {
						...routeData,
						allowRouteEditing, // Include allowRouteEditing in the routeData
					},
					distance,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save route");
			}

			const data = await response.json();

			console.log("Saving allowRouteEditing:", allowRouteEditing);

			onSaveSuccess({
				...data,
				allowRouteEditing, // Pass allowRouteEditing back to the parent component
			});
			setIsLoading(false);
			setRouteUrl(`${mmdObj.siteUrl}/?route=${data.route_id}`);
			setHasSavedRoute(true);
			setActiveTab("share");

			// Scroll to top of the popup
			if (scrollableRef.current) {
				scrollableRef.current.scrollTop = 0;
			}

			toast.success(__("Route saved successfully!", "mmd"));
		} catch (error) {
			setIsLoading(false);
			toast.error(__("Failed to save route, please try again", "mmd"));
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
