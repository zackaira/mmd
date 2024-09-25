import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import { toast } from "react-toastify";
import parse from "html-react-parser";
// import { mapStyles } from "../../utils";

const MapBoxControls = ({
	userDetails,
	isRouteEditable,
	allowRouteEditing,
	onToggleEditable,
	lastDistance,
	fullDistance,
	units,
	onUnitChange,
	onUndo,
	onRedo,
	onClear,
	latestLatLng,
	onSnapToggle,
	snapToRoutes,
	canUndo,
	canRedo,
	canDeleteSave,
	onZoomToBounds,
	canZoomToBounds,
	centerOnNewMarker,
	onToggleCenterOnNewMarker,
	onToggleSearch,
	onToggleSaveShare,
	routeData,
	sliderPosition,
	routeLength,
	onSliderChange,
	pointsOfInterest,
	arePoisVisible,
	onPoiClick,
	onTogglePoiVisibility,
	isPlacingPoi,
	onAddPoi,
	showDistanceMarkers,
	onToggleDistanceMarkers,
	currentMapStyle,
}) => {
	const [isBoxHidden, setIsBoxHidden] = useState(false);

	useEffect(() => {
		if (isBoxHidden) {
			document.body.classList.add("mmd-box-hide");
		} else {
			document.body.classList.remove("mmd-box-hide");
		}

		return () => {
			document.body.classList.remove("mmd-box-hide");
		};
	}, [isBoxHidden]);

	const handleToggle = () => {
		setIsBoxHidden(!isBoxHidden);
	};

	const handleSliderChange = (event) => {
		const newPosition = parseInt(event.target.value, 10);
		onSliderChange(newPosition);
	};

	const handleAddPoi = () => {
		onAddPoi();
	};

	return (
		<>
			<div className="mmd-boxwrap">
				{routeLength > 0 && (
					<div className="mmd-route-slider">
						<input
							type="range"
							min="0"
							max="100"
							value={sliderPosition}
							onChange={handleSliderChange}
							className="mmd-slider"
						/>
						{/* <div className="mmd-slider-label">
							{__("Route Progress", "mmd")}: {sliderPosition}%
						</div> */}
					</div>
				)}

				<div
					className={`mmd-box-toggle fa-solid ${
						isBoxHidden ? "fa-chevron-right" : "fa-chevron-left"
					}`}
					onClick={handleToggle}
				></div>

				<div className="mmd-box">
					<div className="mmd-box-left">
						<h5 className="box-title">{__("Last Segment", "mmd")}</h5>
						<div className="mmd-last-distance">
							<span>{lastDistance}</span> {units}
						</div>
						<h5 className="box-title space">{__("Last Location", "mmd")}</h5>
						<div className="mmd-latlng">
							{__("LAT: ", "mmd")}{" "}
							<span>
								{latestLatLng ? latestLatLng[0].toFixed(4) : "0.0000"}
							</span>
						</div>
						<div className="mmd-latlng">
							{__("LNG: ", "mmd")}{" "}
							<span>
								{latestLatLng ? latestLatLng[1].toFixed(4) : "0.0000"}
							</span>
						</div>
					</div>
					<div className="mmd-box-right">
						<h5 className="box-title">{__("Total Distance", "mmd")}</h5>
						<div className="mmd-distance">
							<span>{fullDistance}</span> {units}
						</div>
						<div>
							{__("Unit:", "mmd")}
							<select
								id="mmd-units"
								onChange={(e) => onUnitChange(e.target.value)}
								value={units}
							>
								<option value="km">{__("Kilometers", "mmd")}</option>
								<option value="mi">{__("Miles", "mmd")}</option>
								<option value="m">{__("Meters", "mmd")}</option>
								<option value="ft">{__("Feet", "mmd")}</option>
								<option value="yd">{__("Yards", "mmd")}</option>
								<option value="nm">{__("Nautical Miles", "mmd")}</option>
							</select>
						</div>
					</div>
				</div>
				{!isRouteEditable && (
					<div className="mmd-controls">
						{(routeData?.isRouteOwner || allowRouteEditing) && (
							<div
								className="fa-solid fa-edit mmd-control edit"
								onClick={onToggleEditable}
								title={__("Make Route Editable", "mmd")}
							></div>
						)}
						<div
							className={`fa-solid fa-expand mmd-control zoom-to-bounds ${
								canZoomToBounds ? "" : "disabled"
							}`}
							{...(canZoomToBounds ? { onClick: onZoomToBounds } : {})}
							title={__("Zoom to Route Bounds", "mmd")}
						></div>
						<div
							className="fa-solid fa-location-dot mmd-control clear"
							onClick={onClear}
							title={__("Start a New Route", "mmd")}
						></div>
					</div>
				)}
				{isRouteEditable && (
					<div className="mmd-controls">
						<div
							className="fa-solid fa-search mmd-control search"
							onClick={onToggleSearch}
							title={__("Search Location", "mmd")}
						></div>
						<div
							className={`fa-solid fa-road mmd-control snapto ${
								snapToRoutes ? "active" : ""
							}`}
							onClick={onSnapToggle}
							title={__("Snap to Roads & Paths", "mmd")}
						></div>
						<div
							className={`fa-solid fa-crosshairs mmd-control center-on-new ${
								centerOnNewMarker ? "active" : ""
							}`}
							onClick={onToggleCenterOnNewMarker}
							title={__("Center Map to New Marker", "mmd")}
						></div>
						<div
							className={`fa-solid fa-expand mmd-control zoom-to-bounds ${
								canZoomToBounds ? "" : "disabled"
							}`}
							{...(canZoomToBounds ? { onClick: onZoomToBounds } : {})}
							title={__("Zoom to Route Bounds", "mmd")}
						></div>
						<div
							className={`fa-solid fa-reply mmd-control undo ${
								canUndo ? "" : "disabled"
							}`}
							{...(canUndo ? { onClick: onUndo } : {})}
							title={__("Undo", "mmd")}
						></div>
						<div
							className={`fa-solid fa-share mmd-control redo ${
								canRedo ? "" : "disabled"
							}`}
							{...(canRedo ? { onClick: onRedo } : {})}
							title={__("Redo", "mmd")}
						></div>
						{/* <div
							className={`fa-solid fa-mountain-sun mmd-control elevation ${
								showElevationProfile ? "active" : ""
							}`}
							onClick={onToggleElevationProfile}
							title={__("Route Elevation", "mmd")}
						></div> */}

						<div
							className={`fa-solid fa-trash-can mmd-control clear ${
								canDeleteSave ? "" : "disabled"
							}`}
							{...(canDeleteSave ? { onClick: onClear } : {})}
							title={__("Delete Route", "mmd")}
						></div>
						<div
							className={`fa-solid fa-download mmd-control save ${
								canDeleteSave ? "" : "disabled"
							}`}
							{...(canDeleteSave
								? { onClick: () => onToggleSaveShare("save") }
								: {})}
							title={__("Save This Route", "mmd")}
						></div>
						<div
							className={`fa-solid fa-share-nodes mmd-control share ${
								canDeleteSave ? "" : "disabled"
							}`}
							{...(canDeleteSave
								? { onClick: () => onToggleSaveShare("share") }
								: {})}
							title={__("Share This Route", "mmd")}
						></div>
						{/* <div
							className={`fa-solid fa-plus mmd-control addpoi ${
								isPlacingPoi ? "active" : ""
							}`}
							{...((routeData?.isRouteOwner || allowRouteEditing) &&
							userDetails?.isPremium
								? { onClick: handleAddPoi }
								: {
										onClick: () => {
											if (!userDetails) {
												toast.error(
													__(
														"Points of interest are logged in Pro feature. Please login.",
														"mmd"
													)
												);
											}
											if (!userDetails.isPremium) {
												toast.error(
													__("Points of interest are a Premium feature.", "mmd")
												);
											}
										},
								  })}
							title={__("Add a Point of Interest", "mmd")}
						></div> */}
					</div>
				)}

				{routeData && (
					<>
						{(routeData?.routeName || routeData?.routeDescription) && (
							<div className="mmd-rdata">
								<h4 className="mmd-rdata-title">{routeData.routeName}</h4>
								<div className="mmd-rdata-desc mmd-trix-style">
									{parse(routeData.routeDescription || "")}
								</div>

								{/* <div className="mmd-rdata-btns">
										<a href="" target="_blank" className="button mmd-rdata-btn">
											{__("View Event Website", "mmd")}
										</a>
										<a href="" target="_blank" className="button mmd-rdata-btn">
											{__("Enter This Event", "mmd")}
										</a>
									</div> */}
							</div>
						)}

						{pointsOfInterest && pointsOfInterest.length > 0 && (
							<div className="mmd-pois">
								<ul className="mmd-poi-list">
									{pointsOfInterest.map((poi) => (
										<li
											key={poi.id}
											className="mmd-poi-marker"
											onClick={() => onPoiClick(poi.id)}
										>
											<span
												className={`poicon fa-solid ${
													poi.icon || "fa-location-dot"
												}`}
											></span>
										</li>
									))}
								</ul>
								<div className="mmd-poi-controls">
									<div
										className={`fa-solid fa-map-pin mmd-control poi-toggle ${
											arePoisVisible ? "active" : ""
										}`}
										onClick={onTogglePoiVisibility}
										title={__("Toggle Points of Interest", "mmd")}
									></div>
								</div>
							</div>
						)}
					</>
				)}

				{/* <div className="mmd-map-style-selector">
					<label htmlFor="mmd-map-style">{__("Map Style:", "mmd")}</label>
					<select
						id="mmd-map-style"
						value={currentMapStyle}
						onChange={(e) => onMapStyleChange(e.target.value)}
					>
						{mapStyles.map((style) => (
							<option key={style.value} value={style.value}>
								{style.name}
							</option>
						))}
					</select>
				</div> */}
			</div>
		</>
	);
};

export default MapBoxControls;
