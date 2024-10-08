import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import Loader from "../../../Loader";

const ApplyForPublicPopup = ({ isOpen, onClose, route, onApply, mmdObj, isApplyingForPublic }) => {
    const [selectedEventType, setSelectedEventType] = useState("");
    const [eventTypes, setEventTypes] = useState([]);
    const [aboutEvent, setAboutEvent] = useState("");
    const [sendLinks, setSendLinks] = useState("");

    useEffect(() => {
        if (mmdObj && mmdObj.event_types) {
            setEventTypes(mmdObj.event_types);
        }
    }, [mmdObj]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply(route.routeId, selectedEventType, aboutEvent, sendLinks);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="mmd-popup-bg" onClick={onClose}></div>
            <div className="mmd-popup">
                <div className="mmd-popup-inner apply-public">
                    {isApplyingForPublic ? (
                        <div className="mmd-load-route">
							<Loader loaderText={__("Sending Application...", "mmd")} />
						</div>
                    ) : (
                        <>
                            <h3>{__("Apply To Make This Route Public:", "mmd")}</h3>
                            <p className="mmd-apply-desc">
                                {__("Public routes can be viewed by anyone and are available for public events or organized group activities.", "mmd")}
                            </p>
                            <form onSubmit={handleSubmit}>
                                <div className="mmd-form-row">
                                    <label htmlFor="eventType">{__("Event Type", "mmd")}</label>
                                    <select
                                        id="eventType"
                                        value={selectedEventType}
                                        onChange={(e) => setSelectedEventType(e.target.value)}
                                        required
                                    >
                                        <option value="">{__("Select an event type", "mmd")}</option>
                                        {eventTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mmd-form-row">
                                    <label htmlFor="aboutEvent">{__("About Event", "mmd")}</label>
                                    <p>{__("Please tell us a bit about the event", "mmd")}</p>
                                    <textarea
                                        id="aboutEvent"
                                        value={aboutEvent}
                                        onChange={(e) => setAboutEvent(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="mmd-form-row">
                                    <label htmlFor="sendLinks">{__("Proof Links", "mmd")}</label>
                                    <p>{__("Please send through links to websites, social profiles, or any other info to help get approved.", "mmd")}</p>
                                    <textarea
                                        id="sendLinks"
                                        value={sendLinks}
                                        onChange={(e) => setSendLinks(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mmd-form-group">
                                    <button type="submit" className="mmd-btn mmd-btn-primary">
                                        {__("Submit Application", "mmd")}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
                <button onClick={onClose} className="mmd-popup-close fa-solid fa-xmark"></button>
            </div>
        </>
    );
};

export default ApplyForPublicPopup;