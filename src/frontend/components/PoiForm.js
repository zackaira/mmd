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
				<div className="mmd-popup-inner poiform">
					<h3>{__("Point of Interest:", "mmd")}</h3>
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
								rows={5}
								required
							/>
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
