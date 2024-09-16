import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import InputToggleSwitch from "../../backend/components/inputs/InputToggleSwitch";
import MMDTrixEditor from "./UI/mmdTrixEditor";

const SaveEditForm = ({
	isPremiumUser,
	routeName,
	setRouteName,
	routeDescription,
	setRouteDescription,
	routeTags,
	routeActivity,
	setRouteActivity,
	activities,
	handleTagKeyDown,
	removeTag,
	onSubmit,
	allowRouteEditing,
	setAllowRouteEditing,
	popupTitle,
	isSharedRoute,
	isEditing,
	isRouteOwner,
	isSaved,
	onFormChange,
	isFormModified,
}) => {
	const routeNameRef = useRef(null);
	const [trixContent, setTrixContent] = useState(routeDescription);

	useEffect(() => {
		if (routeNameRef.current) {
			routeNameRef.current.focus();
		}
	}, []);

	const handleSubmit = (e, saveAsNew = false) => {
		e.preventDefault();
		const formData = {
			routeName,
			routeDescription: isPremiumUser ? trixContent : routeDescription,
			routeTags,
			routeActivity,
			allowRouteEditing,
		};
		onSubmit(e, formData, saveAsNew);
	};

	const handleTrixChange = (newContent) => {
		setTrixContent(newContent);
		setRouteDescription(newContent);
		onFormChange();
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		switch (name) {
			case "routeName":
				setRouteName(value);
				break;
			case "routeDescription":
				setRouteDescription(value);
				break;
			case "routeActivity":
				setRouteActivity(value);
				break;
		}
		onFormChange();
	};

	const handleTagKeyDownWrapper = (e) => {
		handleTagKeyDown(e);
		onFormChange();
	};

	const removeTagWrapper = (index) => {
		removeTag(index);
		onFormChange();
	};

	return (
		<div className="content save">
			<h3>
				{popupTitle ? (
					popupTitle
				) : (
					<>
						{isSharedRoute && !isEditing
							? __("Save Shared Route:", "mmd")
							: isEditing
							? __("Edit Your Route:", "mmd")
							: __("Save Your Route:", "mmd")}
					</>
				)}
			</h3>
			<p>
				{__(
					"Save your route to track progress, revisit favorite trails, and easily plan future adventures. It's a simple way to keep your experiences organized and ready for your next challenge.",
					"mmd"
				)}
			</p>
			<form onSubmit={handleSubmit}>
				<div className="mmd-form-row">
					<label>
						{__("Route Name", "mmd")}
						<span className="required">*</span>
					</label>
					<input
						type="text"
						name="routeName"
						value={routeName}
						onChange={handleInputChange}
						required
						ref={routeNameRef}
					/>
				</div>
				<div className="mmd-form-row">
					<label>{__("Description", "mmd")}</label>
					{isPremiumUser ? (
						<>
							<MMDTrixEditor
								initialContent={routeDescription}
								onChange={handleTrixChange}
							/>
						</>
					) : (
						<textarea
							name="routeDescription"
							value={routeDescription}
							onChange={handleInputChange}
							rows={4}
						></textarea>
					)}
				</div>
				<div className="mmd-form-row">
					<label>
						{__(
							"Tags (optional - to help you find routes again, when there are lots)",
							"mmd"
						)}
					</label>
					<div className="tags-input">
						<div className="tags-list">
							{routeTags.map((tag, index) => (
								<span key={index} className="tag">
									{tag}
									<span
										className="tag-close"
										onClick={() => removeTagWrapper(index)}
									>
										&times;
									</span>
								</span>
							))}
						</div>
						<input
							type="text"
							name="routeTags"
							onKeyDown={handleTagKeyDownWrapper}
							placeholder={__("Add a tag and press enter or comma", "mmd")}
						/>
					</div>
				</div>
				{activities.length > 0 && (
					<div className="mmd-form-row">
						<label>{__("What is the route used for?", "mmd")}</label>
						<div className="radio-group">
							{activities.map((activityOption) => (
								<label
									htmlFor={activityOption}
									key={activityOption}
									className="radio-item"
								>
									<input
										type="radio"
										name="routeActivity"
										id={activityOption}
										value={activityOption}
										checked={routeActivity === activityOption}
										onChange={handleInputChange}
									/>
									{activityOption.replace("_", " ")}
								</label>
							))}
						</div>
					</div>
				)}

				{(!isEditing || isRouteOwner) && (
					<div className="mmd-form-row">
						<div className="toggle-switch-container">
							<label className="toggle-switch-label" htmlFor="route-editable">
								{__("Allow anyone to edit this route", "mmd")}
							</label>
							<InputToggleSwitch
								slug="route-editable"
								id="route-editable"
								title="Allow anyone to edit this route"
								value={allowRouteEditing}
								onChange={() => {
									setAllowRouteEditing(!allowRouteEditing);
									onFormChange();
								}}
							/>
						</div>
					</div>
				)}

				<div className="mmd-button-group">
					{isSaved ? (
						<>
							<button
								type="submit"
								onClick={(e) => handleSubmit(e, false)}
								disabled={!isFormModified}
							>
								{__("Update Route", "mmd")}
							</button>
							<button type="button" onClick={(e) => handleSubmit(e, true)}>
								{__("Save as New Route", "mmd")}
							</button>
						</>
					) : (
						<button type="submit">{__("Save Route", "mmd")}</button>
					)}
				</div>
			</form>
		</div>
	);
};

export default SaveEditForm;
