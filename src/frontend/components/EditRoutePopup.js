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
	const [allowRouteEditing, setAllowRouteEditing] = useState(false);

	useEffect(() => {
		if (isOpen && route) {
			setRouteName(route.routeName || "");
			setRouteDescription(route.routeDescription || "");
			setRouteTags(route.routeTags ? route.routeTags : []);
			setRouteActivity(route.routeActivity || "");
			setAllowRouteEditing(route.routeData.allowRouteEditing || false);
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
			routeData: {
				...route.routeData,
				allowRouteEditing: allowRouteEditing,
			},
		};
		await onSave(updatedRoute);
		onClose();
	};

	const handleTagKeyDown = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const newTag = e.target.value.trim();
			if (newTag && !tags.includes(newTag)) {
				setRouteTags([...tags, newTag]);
				e.target.value = "";
			}
		}
	};

	const removeTag = (indexToRemove) => {
		setTags(tags.filter((_, index) => index !== indexToRemove));
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="mmd-popup-bg" onClick={onClose}></div>
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
							isFormModified={isFormModified}
							setIsFormModified={setIsFormModified}
						/>
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

export default EditRoutePopup;
