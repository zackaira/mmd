import React, { useState, useEffect, useRef } from "react";

const SearchPopup = ({ mapRef, mapboxClient, isOpen, onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceTimerRef = useRef(null);

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
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for a location"
						className="search-input"
					/>
					{isLoading && <div className="search-loading">Loading...</div>}
					{suggestions.length > 0 && (
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
