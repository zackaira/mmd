import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import Loader from "../../Loader";

const SearchPopup = ({ mapRef, mapboxClient, isOpen, onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceTimerRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		if (searchQuery.length > 3) {
			setIsLoading(true);
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

			debounceTimerRef.current = setTimeout(() => {
				fetchSuggestions(searchQuery);
			}, 300);
		} else {
			setSuggestions([]);
		}

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [searchQuery]);

	const fetchSuggestions = async (query) => {
		try {
			const response = await mapboxClient.current.geocoding
				.forwardGeocode({
					query,
					limit: 5,
					autocomplete: true,
				})
				.send();

			if (response && response.body && response.body.features) {
				setSuggestions(response.body.features);
			}
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelect = (feature) => {
		const map = mapRef.current;
		map.flyTo({
			center: feature.center,
			zoom: 14,
		});
		onClose();
		setSuggestions([]);
		setSearchQuery("");
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="mmd-popup-bg" onClick={onClose}></div>
			<div className="mmd-popup">
				<div className="mmd-popup-inner">
					<input
						type="text"
						ref={inputRef}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for a location"
						className="search-input"
					/>
					{isLoading ? (
						<div className="search-loading">
							<Loader width={40} height={40} />
						</div>
					) : (
						<>
							{suggestions && suggestions.length > 0 && (
								<ul className="search-suggestions">
									{suggestions.map((feature) => (
										<li
											key={feature.id}
											onClick={() => handleSelect(feature)}
											className="search-suggestion"
										>
											{feature.place_name}
										</li>
									))}
								</ul>
							)}
						</>
					)}
					{suggestions.length === 0 && searchQuery.length > 3 && !isLoading && (
						<div className="mmd-no-search">
							{__("No suggestions found", "mmd")}
						</div>
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

export default SearchPopup;
