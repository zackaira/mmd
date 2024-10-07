import React, { useState, useRef, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import MapRoutes from "./MapRoutes";

const MapExtraSettings = ({ mmdObj, showDistanceMarkers, onToggleDistanceMarkers, handleLoadRoute }) => {
    const [panelVisible, setPanelVisible] = useState(false);
    const [showRoutes, setShowRoutes] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const panelRef = useRef(null);

    const togglePanel = (section) => {
        if (!panelVisible) {
            setPanelVisible(true);
            setShowRoutes(section === "routes");
            setShowControls(section === "controls");
        } else {
            if (section === "routes") {
                setShowRoutes(true);
                setShowControls(false);
            } else if (section === "controls") {
                setShowControls(true);
                setShowRoutes(false);
				
            }
        }
    };

    const closePanel = () => {
        setPanelVisible(false);
    };

    return (
		<>
			{panelVisible && (
				
				<div className="mmd-extraset-bg" onClick={closePanel}></div>
			)}
			<div className={`mmd-extraset ${panelVisible ? "open" : ""}`} ref={panelRef}>
				<div className="mmd-extra-icons">
					{mmdObj.userDetails?.user_id && (
						<div className="mmd-routes-icon" onClick={() => togglePanel("routes")}>
							<span className="fa-solid fa-route"></span>
						</div>
					)}
					<div className="mmd-extraset-icon" onClick={() => togglePanel("controls")}>
						<span className="fa-solid fa-gear"></span>
					</div>
					<div className="mmd-extraset-close fa-solid fa-xmark" onClick={closePanel}></div>
				</div>

				<div className="mmd-extra-panels">
					{showRoutes && (
						<h4>{__("Saved Routes", "mmd")}</h4>
					)}
					{showControls && (
						<h4>{__("Settings", "mmd")}</h4>
					)}

					{showControls && (
						<div className={`mmd-extraset-controls`}>
							<div className="mmd-extraset-control">
								<label>
									<input
										type="checkbox"
										checked={showDistanceMarkers}
										onChange={onToggleDistanceMarkers}
									/>
									{__("Show distance markers", "mmd")}
								</label>
							</div>
						</div>
					)}

					{showRoutes && (
						<div className={`mmd-map-routes`}>
							<div>
								<MapRoutes mmdObj={mmdObj} handleLoadRoute={handleLoadRoute} />
							</div>
						</div>
					)}
				</div>
			</div>
		</>
    );
};

export default MapExtraSettings;