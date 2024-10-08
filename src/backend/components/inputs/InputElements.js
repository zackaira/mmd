import React, { useState, useEffect, useRef } from "react";
import Sortable from "sortablejs";
import { __ } from "@wordpress/i18n";
import { mmdConvertToSlug } from "../../helpers";

const InputElements = (props) => {
	const inputTitleSlug = mmdConvertToSlug(props.slug)
		? mmdConvertToSlug(props.slug)
		: mmdConvertToSlug(props.title);

	// State to hold the list of added fields
	const [fields, setFields] = useState([]);
	const [currentField, setCurrentField] = useState({ id: Date.now(), name: "", value: "", description: "" });

	// Reference to the fields list container
	const fieldsListRef = useRef(null);

	// Handle input changes for the current field
	const handleInputChange = (e) => {
		const { name, value } = e.target;

		// Update the currentField state
		let updatedField = { ...currentField, [name]: value };

		// If the name is being changed, automatically populate the value with a slug version
		if (name === "name") {
			// Replace spaces with underscores and convert to lowercase
			const slugifiedValue = value.replace(/\s+/g, "_").toLowerCase();
			updatedField = { ...updatedField, value: slugifiedValue };
		}

		setCurrentField(updatedField);
	};

	// Add a new field to the fields array
	const addField = () => {
		if (currentField.name && currentField.value) {
			const newField = { ...currentField, id: Date.now() };
			const newFields = [...fields, newField];
			setFields(newFields);
			setCurrentField({ id: Date.now(), name: "", value: "", description: "" }); // Reset current field inputs
			props.onChange({ target: { name: inputTitleSlug, value: JSON.stringify(newFields) } }); // Update main input value
		}
	};

	// Remove a specific field
	const removeField = (index) => {
		if (
			window.confirm(
				__("Are you sure?", "mmd")
			)
		) {
			const updatedFields = fields.filter((_, i) => i !== index);
			setFields(updatedFields);
			props.onChange({ target: { name: inputTitleSlug, value: JSON.stringify(updatedFields) } }); // Update main input value
		}
	};

	// Initialize the fields from the input value if props.value is provided
	useEffect(() => {
		if (props.value) {
			try {
				const initialFields = JSON.parse(props.value);
				if (Array.isArray(initialFields)) setFields(initialFields);
			} catch (e) {
				console.error("Invalid JSON input value:", props.value);
			}
		}
	}, [props.value]);

	// Setup Sortable for the fields list if there are 2 or more items
	useEffect(() => {
		let sortableInstance = null;
		if (fieldsListRef.current && fields.length > 1) {
			sortableInstance = Sortable.create(fieldsListRef.current, {
				animation: 150,
				handle: ".dashicons-menu-alt",
				onEnd: (evt) => {
					// Prevent onEnd from firing before React finishes updating
					if (evt.oldIndex === undefined || evt.newIndex === undefined) return;

					// Create a copy of fields to safely reorder items
					const reorderedFields = [...fields];
					const [movedItem] = reorderedFields.splice(evt.oldIndex, 1);
					reorderedFields.splice(evt.newIndex, 0, movedItem);

					// Update state with reordered fields
					setFields(reorderedFields);
					props.onChange({
						target: { name: inputTitleSlug, value: JSON.stringify(reorderedFields) }
					});
				}
			});
		}
		return () => {
			if (sortableInstance) sortableInstance.destroy(); // Clean up on unmount
		};
	}, [fields]);

	return (
		<div className="repeater-wrapper">
			<div className="field-wrapper">
				<div className="inputs">
					<input
						type="text"
						name="name"
						placeholder="Name"
						value={currentField.name || ""}
						onChange={handleInputChange}
						className={`regular-text ${props.className || ""}`}
					/>
					<input
						type="text"
						name="value"
						placeholder="Value"
						value={currentField.value || ""}
						onChange={handleInputChange}
						className={`regular-text ${props.className || ""}`}
					/>
				</div>
				<div className="txtarea">
					<textarea
						name="description"
						placeholder="Description"
						value={currentField.description || ""}
						onChange={handleInputChange}
						className={`regular-text ${props.className || ""}`}
					></textarea>
					<button type="button" onClick={addField}>
						{__("Add", "mmd")}
					</button>
				</div>
			</div>

			<div className="fields-list" ref={fieldsListRef}>
				{fields && fields.length > 0 ? (
					fields
						.filter((field) => field !== undefined) // Safeguard against undefined items
						.map((field, index) => (
							<div key={field.id || index} className="field-item">
								<div className="field-item-top">
									{fields.length > 1 && <div className="dashicons dashicons-menu-alt"></div>}
									<div className="field-item-name">
										<span>{__("Name: ", "mmd")}</span> {field.name}
									</div>
									<div className="field-item-value">
										<span>{__("Value: ", "mmd")}</span> {field.value}
									</div>
									<button type="button" className="dashicons dashicons-no-alt" onClick={() => removeField(index)}></button>
								</div>
								{field.description && (
									<div className="field-item-desc">
										<span>{__("Description: ", "mmd")}</span> {field.description}
									</div>
								)}
							</div>
						))
				) : (
					<p>{__("No fields added yet.", "mmd")}</p>
				)}
			</div>

			{/* Main input field that holds the JSON representation of the fields array */}
			<input
				type="hidden"
				id={inputTitleSlug}
				name={inputTitleSlug}
				value={JSON.stringify(fields)} // Set value to JSON string of fields
				onChange={props.onChange}
				className={`regular-text ${props.className || ""}`}
				{...(props.disabled && { disabled: true })}
			/>
		</div>
	);
};

export default InputElements;
