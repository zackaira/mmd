import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import Loader from "../../Loader";

const EventApplications = ({ mmdObj }) => {
    const [activeTab, setActiveTab] = useState("pending");
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [counts, setCounts] = useState({ pending_count: 0, approved_count: 0, denied_count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [adminNotes, setAdminNotes] = useState({});
    const [showAdminNotes, setShowAdminNotes] = useState({});
    const [isProcessing, setIsProcessing] = useState({});

    useEffect(() => {
        fetchApplications();
    }, [activeTab, currentPage]);

    const fetchApplications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = `${mmdObj.apiUrl}mmd-api/v1/public-route-applications?status=${activeTab}&page=${currentPage}`;

            const response = await fetch(url, {
                headers: {
                    "X-WP-Nonce": mmdObj.nonce,
                },
            });
            const data = await response.json();

            if (data.success) {
                setApplications(data.applications || []);
                setCounts(data.counts || { pending_count: 0, approved_count: 0, denied_count: 0 });
                setTotalPages(data.pagination?.total_pages || 1);
            } else {
                console.error("Failed to fetch applications:", data);
                setError("Failed to fetch applications. Please try again.");
                setApplications([]);
                setCounts({ pending_count: 0, approved_count: 0, denied_count: 0 });
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
            setError("An error occurred while fetching applications. Please try again.");
            setApplications([]);
            setCounts({ pending_count: 0, approved_count: 0, denied_count: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveOrDeny = async (applicationId, status) => {
        setIsProcessing(prev => ({ ...prev, [applicationId]: true }));
        try {
            const response = await fetch(
                `${mmdObj.apiUrl}mmd-api/v1/admin-approve-public-route/${applicationId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-WP-Nonce": mmdObj.nonce,
                    },
                    body: JSON.stringify({ status, admin_notes: adminNotes[applicationId] || '' }),
                }
            );
            const data = await response.json();
            if (data.success) {
                fetchApplications();
                setAdminNotes(prev => ({ ...prev, [applicationId]: '' }));
                setShowAdminNotes(prev => ({ ...prev, [applicationId]: false }));
            } else {
                console.log(__(`Failed to ${status} application`, "mmd"));
            }
        } catch (error) {
            console.log(__(`An error occurred while ${status}ing the application`, "mmd"));
        } finally {
            setIsProcessing(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const renderApplications = () => {
        if (isLoading) {
            return <div className="events-loading"><Loader width={32} height={32} /></div>;
        }

        if (applications.length === 0) {
            return <p className="no-events">{__("No applications found.", "mmd")}</p>;
        }

        return (
            <table className="mmd-applications-table">
                <thead>
                    <tr>
                        <th>{__("Route Name", "mmd")}</th>
                        <th>{__("User", "mmd")}</th>
                        <th>{__("Event Type", "mmd")}</th>
                        {activeTab === "pending" && <th className="table-actions">{__("Actions", "mmd")}</th>}
                    </tr>
                </thead>
                <tbody>
                    {applications.map((app) => (
                        <tr key={app.id}>
                            <td>
                                <a href={app.route_url} target="_blank" rel="noopener noreferrer">
                                    {app.route_name}
                                </a>
                            </td>
                            <td>
                                <a href={app.user_profile_url} target="_blank" rel="noopener noreferrer">
                                    {app.user_name}
                                </a>
                            </td>
                            <td>{app.event_type.replace("_", " ")}</td>
                            {activeTab === "pending" && (
                                <td className="table-actions">
                                    {isProcessing[app.id] ? (
                                        <div className="processing-loader">
                                            <Loader width={18} height={18} />
                                        </div>
                                    ) : (
                                        <>
                                            {showAdminNotes[app.id] && (
                                                <div className="admin-note">
                                                    <textarea
                                                        placeholder={__("Any Admin Notes?", "mmd")}
                                                        value={adminNotes[app.id] || ''}
                                                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                                        className="admin-note-txtarea"
                                                    ></textarea>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleApproveOrDeny(app.id, "approved")}
                                                className="mmd-btn dashicons dashicons-yes"
                                                title={__("Approve", "mmd")}
                                            ></button>
                                            <button
                                                onClick={() => handleApproveOrDeny(app.id, "denied")}
                                                className="mmd-btn dashicons dashicons-no-alt"
                                                title={__("Deny", "mmd")}
                                            ></button>
                                            <button
                                                onClick={() => setShowAdminNotes(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                                                className={`mmd-btn dashicons dashicons-edit ${showAdminNotes[app.id] ? "active" : ""}`}
                                                title={__("Add/Edit Notes", "mmd")}
                                            ></button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="mmd-pagination">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    {__("Previous", "mmd")}
                </button>
                <span>{__("Page", "mmd")} {currentPage} {__("of", "mmd")} {totalPages}</span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    {__("Next", "mmd")}
                </button>
            </div>
        );
    };

    return (
        <div className="mmd-applications-list">
            <div className="mmd-tabs">
                <button
                    className={`mmd-tab ${activeTab === "pending" ? "active" : ""}`}
                    onClick={() => {setActiveTab("pending"); setCurrentPage(1);}}
                >
                    {__("Pending", "mmd")} ({counts.pending_count})
                </button>
                <button
                    className={`mmd-tab ${activeTab === "approved" ? "active" : ""}`}
                    onClick={() => {setActiveTab("approved"); setCurrentPage(1);}}
                >
                    {__("Latest Approved", "mmd")} ({counts.approved_count})
                </button>
                <button
                    className={`mmd-tab ${activeTab === "denied" ? "active" : ""}`}
                    onClick={() => {setActiveTab("denied"); setCurrentPage(1);}}
                >
                    {__("Latest Denied", "mmd")} ({counts.denied_count})
                </button>
            </div>
            <div className="mmd-tab-content">
                {error && <div className="mmd-error">{error}</div>}
                {renderApplications()}
                {activeTab === "pending" && renderPagination()}
            </div>
        </div>
    );
};

export default EventApplications;