import React, { useState } from "react";
import { __ } from "@wordpress/i18n";

const PoiForm = ({ poi, onSave, onCancel }) => {
	const [title, setTitle] = useState(poi?.title || "");
	const [description, setDescription] = useState(poi?.description || "");

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave({ ...poi, title, description });
	};

	return (
		<>
			<div className="mmd-popup-bg" onClick={onCancel}></div>
			<div className="mmd-popup">
				<div className="mmd-popup-inner saveshare">
					<form onSubmit={handleSubmit}>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={__("POI Title", "mmd")}
							required
						/>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={__("POI Description", "mmd")}
						/>
						<button type="submit">{__("Save", "mmd")}</button>
						<button type="button" onClick={onCancel}>
							{__("Cancel", "mmd")}
						</button>
					</form>
				</div>
			</div>
		</>
	);
};

export default PoiForm;
