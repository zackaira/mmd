import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import SaveEditForm from "./SaveEditForm";
import Loader from "../../Loader";

const EditRoutePopup = ({
	isPremiumUser,
	isOpen,
	onClose,
	route,
	onSave,
	mmdObj,
	isSaving,
	isFormModified,
	setIsFormModified,
}) => {
	const [routeName, setRouteName] = useState("");
	const [routeDescription, setRouteDescription] = useState("");
	const [routeTags, setRouteTags] = useState([]);
	const [routeActivity, setRouteActivity] = useState("");
	const [routeDistance, setRouteDistance] = useState(0);
	const [routeData, setRouteData] = useState({});
	const [allowRouteEditing, setAllowRouteEditing] = useState(false);
	const [isRouteOwner, setIsRouteOwner] = useState(false);
	const [isSharedRoute, setIsSharedRoute] = useState(false);
	const [isSaved, setIsSaved] = useState(false);

	console.log("route", route);

	useEffect(() => {
		if (isOpen && route) {
			setRouteName(route.routeName || "");
			setRouteDescription(route.routeDescription || "");
			setRouteTags(route.routeTags ? route.routeTags : []);
			setRouteActivity(route.routeActivity || "");
			setRouteDistance(route.routeDistance || 0);
			setRouteData(route.routeData || {});
			setAllowRouteEditing(route.routeData.allowRouteEditing || false);
			setIsRouteOwner(route.isRouteOwner || false);
			setIsSharedRoute(
				route.isRouteOwner && route.isRouteOwner === false ? true : false
			);
			setIsSaved(route && route.routeId ? true : false);
		}
	}, [isOpen, route]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const updatedRoute = {
			...route,
			routeName: routeName,
			routeDescription: routeDescription,
			routeTags: routeTags.join(","),
			routeActivity: routeActivity,
			routeDistance: routeDistance,
			routeData: {
				...routeData,
				allowRouteEditing: allowRouteEditing,
			},
		};
		console.log("updatedRoute", updatedRoute);

		await onSave(updatedRoute);
		onClose();
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

	const handleClose = () => {
		onClose();
		setIsFormModified(false);
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="mmd-popup-bg" onClick={handleClose}></div>
			<div className="mmd-popup">
				<div className="mmd-popup-inner saveshare">
					{isSaving ? (
						<div className="mmd-load-route">
							<Loader loaderText={__("Saving...", "mmd")} />
						</div>
					) : (
						<SaveEditForm
							isPremiumUser={isPremiumUser}
							routeName={routeName}
							setRouteName={setRouteName}
							routeDescription={routeDescription}
							setRouteDescription={setRouteDescription}
							routeTags={routeTags}
							routeActivity={routeActivity}
							setRouteActivity={setRouteActivity}
							activities={mmdObj.userDetails.activities || []}
							handleTagKeyDown={handleTagKeyDown}
							removeTag={removeTag}
							onSubmit={handleSubmit}
							allowRouteEditing={allowRouteEditing}
							setAllowRouteEditing={setAllowRouteEditing}
							isRouteOwner={isRouteOwner}
							isFormModified={isFormModified}
							setIsFormModified={setIsFormModified}
							isSharedRoute={isSharedRoute}
							isSaved={isSaved}
						/>
					)}
				</div>
				<button
					onClick={handleClose}
					className="mmd-popup-close fa-solid fa-xmark"
				></button>
			</div>
		</>
	);
};

export default EditRoutePopup;
