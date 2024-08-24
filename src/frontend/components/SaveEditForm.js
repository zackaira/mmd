import React from "react";
import { __ } from "@wordpress/i18n";
import InputToggleSwitch from "../../backend/components/inputs/InputToggleSwitch";

const SaveEditForm = ({
	routeName,
	setRouteName,
	description,
	setDescription,
	tags,
	activity,
	setActivity,
	activities,
	handleTagKeyDown,
	removeTag,
	onSubmit,
	allowRouteEditing,
	setAllowRouteEditing,
	popupTitle,
}) => {
	return (
		<div className="content save">
			<h3>{popupTitle ? popupTitle : __("Save Your Route:", "mmd")}</h3>
			<p>
				{__(
					"Save your route to track progress, revisit favorite trails, and easily plan future adventures. It's a simple way to keep your experiences organized and ready for your next challenge.",
					"mmd"
				)}
			</p>
			<form onSubmit={onSubmit}>
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
					<label>
						{__(
							"Tags (optional - to help you find routes again, when there are lots)",
							"mmd"
						)}
					</label>
					<div className="tags-input">
						<div className="tags-list">
							{tags.map((tag, index) => (
								<span key={index} className="tag">
									{tag}
									<span className="tag-close" onClick={() => removeTag(index)}>
										&times;
									</span>
								</span>
							))}
						</div>
						<input
							type="text"
							onKeyDown={handleTagKeyDown}
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
				<div className="mmd-form-row">
					<div className="toggle-switch-container">
						<span className="toggle-switch-label">
							{__("Allow anyone to edit this route", "mmd")}
						</span>
						<InputToggleSwitch
							slug="route-editable"
							title="Allow anyone to edit this route"
							value={allowRouteEditing}
							onChange={() => setAllowRouteEditing(!allowRouteEditing)}
						/>
					</div>
				</div>
				<button type="submit">{__("Save Route", "mmd")}</button>
			</form>
		</div>
	);
};

export default SaveEditForm;
