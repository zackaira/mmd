import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";
import Loader from "../../Loader";

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
}) => {
	const [activeTab, setActiveTab] = useState(action);
	const [routeName, setRouteName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState([]);
	const [activity, setActivity] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [routeUrl, setRouteUrl] = useState("");
	const scrollableRef = useRef(null); // To Scroll the box back to top after save
	const [hasSavedRoute, setHasSavedRoute] = useState(false);

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

			if (hasSavedRoute) {
				setActiveTab("share");
				// Scroll to top
				if (scrollableRef.current) {
					scrollableRef.current.scrollTop = 0;
				}
				setHasSavedRoute(false); // Reset the flag
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
					routeData,
					distance,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save route");
			}

			const data = await response.json();

			onSaveSuccess();
			setIsLoading(false);
			setRouteUrl(`${mmdObj.siteUrl}/?route=${data.route_id}`);
			setActiveTab("share");
			setHasSavedRoute(true); // Set this to true after successful save

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
									<div className="content save">
										<h3>{__("Save Your Route:", "mmd")}</h3>
										<p>
											{__(
												"Save your route to track progress, revisit favorite trails, and easily plan future adventures. It's a simple way to keep your experiences organized and ready for your next challenge.",
												"mmd"
											)}
										</p>
										<form onSubmit={saveRoute}>
											<div className="mmd-form-row">
												<label>
													{__("Route Name", "mmd")}
													<span className="required">*</span>
												</label>
												<input
													type="text"
													value={routeName}
													onChange={(e) => setRouteName(e.target.value)}
													required
												/>
											</div>
											<div className="mmd-form-row">
												<label>
													{__("Description", "mmd")}
													<span className="required">*</span>
												</label>
												<textarea
													value={description}
													onChange={(e) => setDescription(e.target.value)}
													rows={4}
													required
												></textarea>
											</div>
											<div className="mmd-form-row">
												<label>{__("Tags (optional)", "mmd")}</label>
												<div className="tags-input">
													<div className="tags-list">
														{tags.map((tag, index) => (
															<span key={index} className="tag">
																{tag}
																<span
																	className="tag-close"
																	onClick={() => removeTag(index)}
																>
																	&times;
																</span>
															</span>
														))}
													</div>
													<input
														type="text"
														onKeyDown={handleTagKeyDown}
														placeholder={__(
															"Add a tag and press enter or comma",
															"mmd"
														)}
													/>
												</div>
											</div>
											{activities && activities.length > 0 && (
												<div className="mmd-form-row">
													<label>
														{__("What is the route used for?", "mmd")}
													</label>
													<div className="radio-group">
														{activities.map((activityOption) => (
															<label
																htmlFor={activityOption}
																key={activityOption}
																className="radio-item"
															>
																<input
																	type="radio"
																	id={activityOption}
																	name="activity"
																	value={activityOption}
																	checked={activity === activityOption}
																	onChange={(e) => setActivity(e.target.value)}
																/>
																{activityOption.replace("_", " ")}
															</label>
														))}
													</div>
												</div>
											)}
											<button type="submit">{__("Save Route", "mmd")}</button>
										</form>
									</div>
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
											<div className="mmd-share-btns">
												<button
													className="social-btn"
													onClick={() =>
														navigator.clipboard.writeText(routeUrl)
													}
												>
													{__("Copy Route URL", "mmd")}
												</button>
												<button
													className="social-btn"
													onClick={() =>
														window.open(
															`https://www.messenger.com/t/?link=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("Messenger", "mmd")}
												</button>
												<button
													className="social-btn whatsapp"
													onClick={() =>
														window.open(
															`https://wa.me/?text=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("WhatsApp", "mmd")}
												</button>
												<button
													className="social-btn telegram"
													onClick={() =>
														window.open(
															`https://t.me/share/url?url=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("Telegram", "mmd")}
												</button>
												<button
													className="social-btn facebook"
													onClick={() =>
														window.open(
															`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("Facebook", "mmd")}
												</button>
												<button
													className="social-btn xcom"
													onClick={() =>
														window.open(
															`https://twitter.com/intent/tweet?url=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("X.com", "mmd")}
												</button>
												<button
													className="social-btn instagram"
													onClick={() =>
														alert(
															"Instagram does not support direct URL sharing from web. You might need to copy the URL manually."
														)
													}
												>
													{__("Instagram", "mmd")}
												</button>
												<button
													className="social-btn linkedin"
													onClick={() =>
														window.open(
															`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
																routeUrl
															)}`,
															"_blank"
														)
													}
												>
													{__("LinkedIn", "mmd")}
												</button>
											</div>
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
