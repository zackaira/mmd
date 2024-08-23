import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import SaveEditForm from "./SaveEditForm";

const EditRoutePopup = ({ isOpen, onClose, route, onSave, mmdObj }) => {
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
			setAllowRouteEditing(route.allow_route_editing || false);
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
			allow_route_editing: allowRouteEditing,
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

	return (
		<div className="mmd-popup-bg">
			<div className="mmd-popup">
				<div className="mmd-popup-inner saveshare">
					<SaveEditForm
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
					/>
				</div>
				<button
					onClick={onClose}
					className="mmd-popup-close fa-solid fa-xmark"
				></button>
			</div>
		</div>
	);
};

export default EditRoutePopup;
