import React, { useState, useEffect, useRef } from "react";

const SearchPopup = ({ mapRef, mapboxClient, isOpen, onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceTimerRef = useRef(null);

	useEffect(() => {
		if (searchQuery.length > 3) {
			setIsLoading(true);
			fetchSuggestions(searchQuery);
		} else {
			setSuggestions([]);
		}
	}, [searchQuery]);

	useEffect(() => {
		console.log("Search query changed:", searchQuery);
		if (searchQuery.length > 3) {
			setIsLoading(true);
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

			debounceTimerRef.current = setTimeout(() => {
				console.log("Debounce timer triggered");
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
		console.log("Fetching suggestions for:", query);
		try {
			const response = await mapboxClient.current.geocoding
				.forwardGeocode({
					query,
					limit: 5,
					autocomplete: true,
				})
				.send();

			console.log("Geocoding response:", response);

			if (response && response.body && response.body.features) {
				console.log("Suggestions:", response.body.features);
				setSuggestions(response.body.features);
			} else {
				console.log("No suggestions found");
			}
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		console.log("Suggestions updated:", suggestions);
	}, [suggestions]);

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
					{suggestions.length === 0 && searchQuery.length > 3 && !isLoading && (
						<div>No suggestions found</div>
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
