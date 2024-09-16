import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import MMDTrixEditor from "./UI/mmdTrixEditor";

const PoiForm = ({ poi, onSave, onCancel, isPremiumUser }) => {
	const [title, setTitle] = useState(poi?.title || "");
	const [description, setDescription] = useState(poi?.description || "");
	const [icon, setIcon] = useState(poi?.icon || "fa-location-dot");
	const titleInputRef = useRef(null);
	const [trixContent, setTrixContent] = useState(description);

	useEffect(() => {
		if (titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, []);

	const handleSubmit = (e) => {
		e.preventDefault();
		const poiData = {
			title,
			description: isPremiumUser ? trixContent : description,
			icon,
			lngLat: poi.lngLat,
		};
		onSave(poiData);
	};

	const handleTrixChange = (newContent) => {
		setTrixContent(newContent);
		setDescription(newContent);
	};

	const iconOptions = [
		{ value: "fa-location-dot", label: __("Map Marker", "mmd") },
		{ value: "fa-info-circle", label: __("Info", "mmd") },
		{ value: "fa-triangle-exclamation", label: __("Caution", "mmd") },
		{ value: "fa-star", label: __("Star", "mmd") },
		{ value: "fa-flag", label: __("Flag", "mmd") },
		{ value: "fa-flag-checkered", label: __("Checkered Flag", "mmd") },
		{ value: "fa-camera", label: __("Camera", "mmd") },
		{ value: "fa-coffee", label: __("Coffee", "mmd") },
		{ value: "fa-utensils", label: __("Restaurant", "mmd") },
		{ value: "fa-person-running", label: __("Running", "mmd") },
		{ value: "fa-person-biking", label: __("Cycling", "mmd") },
		{ value: "fa-person-swimming", label: __("Swimming", "mmd") },
		{ value: "fa-person-hiking", label: __("Hiking", "mmd") },
		{ value: "fa-mountain-sun", label: __("Mountain / Hill", "mmd") },
		{ value: "fa-dove", label: __("Bird Sighting", "mmd") },
		{ value: "fa-binoculars", label: __("Observation Point", "mmd") },
		{ value: "fa-tree", label: __("Notable Tree / Plant", "mmd") },
		{ value: "fa-water", label: __("Water Source", "mmd") },
		{ value: "fa-fish", label: __("Fishing", "mmd") },
		{ value: "fa-restroom", label: __("Restroom", "mmd") },
		{ value: "fa-campground", label: __("Campsite", "mmd") },
		{ value: "fa-parking", label: __("Parking", "mmd") },
		{ value: "fa-landmark", label: __("Landmark", "mmd") },
		{ value: "fa-monument", label: __("Monument", "mmd") },
		{ value: "fa-suitcase-medical", label: __("Suitcase Medical", "mmd") },
		{ value: "fa-truck-medical", label: __("Truck Medical", "mmd") },
		{ value: "fa-circle-question", label: __("Question", "mmd") },
		{ value: "fa-circle-xmark", label: __("X", "mmd") },
		{ value: "fa-heart", label: __("Heart", "mmd") },
		{ value: "fa-lightbulb", label: __("Lightbulb", "mmd") },
		{ value: "fa-skull-crossbones", label: __("Skull Crossbones", "mmd") },
	];

	return (
		<>
			<div className="mmd-popup-bg" onClick={onCancel}></div>
			<div className="mmd-popup poiform">
				<div className="mmd-popup-inner">
					<h3>{__("Point of Interest:", "mmd")}</h3>
					<p>
						{poi?.title || poi?.description
							? __(
									"Edit your Point of Interest (POI) explaining something interesting or important along the route for yourself or for friends viewing your route.",
									"mmd"
							  )
							: __(
									"Create a Point of Interest (POI) to highlight something interesting or important along the route for yourself or for friends viewing your route.",
									"mmd"
							  )}
					</p>
					<form onSubmit={handleSubmit}>
						<div className="mmd-form-row">
							<label>
								{__("Title", "mmd")}
								<span className="required">*</span>
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								ref={titleInputRef}
							/>
						</div>
						<div className="mmd-form-row">
							<label>{__("Description", "mmd")}</label>
							{isPremiumUser ? (
								<>
									<MMDTrixEditor
										initialContent={description}
										onChange={handleTrixChange}
									/>
								</>
							) : (
								<textarea
									name="routeDescription"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
								></textarea>
							)}
						</div>
						<div className="mmd-form-row">
							<label htmlFor="poi-icon">{__("Marker / Icon", "mmd")}</label>
							<div className="poiform-icon">
								<select
									id="poi-icon"
									value={icon}
									onChange={(e) => setIcon(e.target.value)}
								>
									{iconOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								<div className="poiform-icon-preview">
									<i className={`poicon fa-solid ${icon}`}></i>
								</div>
							</div>
						</div>
						<div className="mmd-poi-btns">
							<button type="submit" className="poi-btn">
								{__("Save", "mmd")}
							</button>
							<button type="button" className="poi-btn" onClick={onCancel}>
								{__("Cancel", "mmd")}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
};

export default PoiForm;
