import React, { useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import Trix from "trix";
import "trix/dist/trix.css";
import InputToggleSwitch from "../../backend/components/inputs/InputToggleSwitch";

const SaveEditForm = ({
	isPremiumUser,
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
	isSharedRoute,
	isEditing,
}) => {
	const routeNameRef = useRef(null);
	const trixEditorRef = useRef(null);

	useEffect(() => {
		if (routeNameRef.current) {
			routeNameRef.current.focus();
		}

		if (trixEditorRef.current) {
			// Remove unwanted buttons
			trixEditorRef.current.toolbarElement
				.querySelector(".trix-button--icon-attach")
				.remove();
			trixEditorRef.current.toolbarElement
				.querySelector(".trix-button-group--file-tools")
				.remove();
			trixEditorRef.current.toolbarElement
				.querySelector(".trix-button-group-spacer")
				.remove();
			trixEditorRef.current.toolbarElement
				.querySelector(".trix-button-group--history-tools")
				.remove();
		}
	}, []);

	useEffect(() => {
		if (trixEditorRef.current && isPremiumUser) {
			const trixEditor = trixEditorRef.current;
			trixEditor.editor.loadHTML(description);
		}
	}, [description, isPremiumUser]);

	const handleTrixChange = (e) => {
		const htmlContent = e.target.innerHTML;
		setDescription(htmlContent);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = {
			routeName,
			description: isPremiumUser
				? trixEditorRef.current.innerHTML
				: description,
			tags,
			activity,
			allowRouteEditing,
		};
		onSubmit(e, formData);
	};

	console.log("isPremiumUser: ", isPremiumUser);
	console.log("Description in SaveEditForm: ", description);

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
						value={routeName}
						onChange={(e) => setRouteName(e.target.value)}
						required
						ref={routeNameRef}
					/>
				</div>
				<div className="mmd-form-row">
					<label>{__("Description", "mmd")}</label>
					{isPremiumUser ? (
						<>
							<trix-editor
								ref={trixEditorRef}
								onChange={handleTrixChange}
								value={description}
								options={{
									toolbar: {
										buttons: [
											"bold",
											"italic",
											"link",
											"undo",
											"redo",
											"heading",
											"quote",
											"code",
											"ol",
											"ul",
											"hr",
										],
									},
									placeholder: "Enter your text here...",
								}}
							></trix-editor>
						</>
					) : (
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
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
						<label className="toggle-switch-label" htmlFor="route-editable">
							{__("Allow anyone to edit this route", "mmd")}
						</label>
						<InputToggleSwitch
							slug="route-editable"
							id="route-editable"
							title="Allow anyone to edit this route"
							value={allowRouteEditing}
							onChange={() => setAllowRouteEditing(!allowRouteEditing)}
						/>
					</div>
				</div>
				<button type="submit">
					{isSharedRoute && !isEditing
						? __("Save as New Route", "mmd")
						: isEditing
						? __("Update Route", "mmd")
						: __("Save Route", "mmd")}
				</button>
			</form>
		</div>
	);
};

export default SaveEditForm;
