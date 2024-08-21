import React from "react";
import { __ } from "@wordpress/i18n";

const MapBoxControls = ({
	isRouteEditable,
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
	onToggleElevationProfile,
	showElevationProfile,
}) => {
	return (
		<div className="mmd-boxwrap">
			<div className="mmd-box">
				<div className="mmd-box-left">
					<h5 className="box-title">{__("Last Segment", "mmd")}</h5>
					<div className="mmd-last-distance">
						<span>{lastDistance}</span> {units}
					</div>
					<h5 className="box-title space">{__("Last Location", "mmd")}</h5>
					<div className="mmd-latlng">
						{__("LAT: ", "mmd")}{" "}
						<span>{latestLatLng ? latestLatLng[0].toFixed(4) : "0.0000"}</span>
					</div>
					<div className="mmd-latlng">
						{__("LNG: ", "mmd")}{" "}
						<span>{latestLatLng ? latestLatLng[1].toFixed(4) : "0.0000"}</span>
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
					<div
						className="fa-solid fa-edit mmd-control edit"
						onClick={onToggleEditable}
						title={__("Make Route Editable", "mmd")}
					></div>
				</div>
			)}
			{isRouteEditable && (
				<div className="mmd-controls">
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
					<div
						className="fa-solid fa-search mmd-control search"
						onClick={onToggleSearch}
						title={__("Search Location", "mmd")}
					></div>
					<div
						className={`fa-solid fa-mountain-sun mmd-control elevation ${
							showElevationProfile ? "active" : ""
						}`}
						onClick={onToggleElevationProfile}
						title={__("Route Elevation", "mmd")}
					></div>

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
				</div>
			)}
		</div>
	);
};

export default MapBoxControls;
