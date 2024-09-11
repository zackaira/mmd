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
}) => {
	const [routeName, setRouteName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState([]);
	const [activity, setActivity] = useState("");
	const [allowRouteEditing, setAllowRouteEditing] = useState(false);

	useEffect(() => {
		if (isOpen && route) {
			setRouteName(route.route_name || "");
			setDescription(route.route_description || "");
			setTags(route.route_tags ? route.route_tags.split(",") : []);
			setActivity(route.route_activity || "");
			setAllowRouteEditing(route.allowRouteEditing || false);
		}
	}, [isOpen, route]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const updatedRoute = {
			...route,
			route_name: routeName,
			route_description: description,
			route_tags: tags.join(","),
			route_activity: activity,
			allowRouteEditing: allowRouteEditing,
		};
		await onSave(updatedRoute);
		onClose();
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

	if (!isOpen) return null;

	console.log("EditRoutePopup description", description);

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
							description={description}
							setDescription={setDescription}
							tags={tags}
							activity={activity}
							setActivity={setActivity}
							activities={mmdObj.userDetails.activities || []}
							handleTagKeyDown={handleTagKeyDown}
							removeTag={removeTag}
							onSubmit={handleSubmit}
							allowRouteEditing={allowRouteEditing}
							setAllowRouteEditing={setAllowRouteEditing}
							popupTitle={__("Edit Route", "mmd")}
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
