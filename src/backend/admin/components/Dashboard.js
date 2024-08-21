import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";

const Dashboard = ({ mmdObj }) => {
	const dashboardList = mmdObj.mmdOptions;

	return <div className="mmd-dash-stats">Dashboard Widget</div>;
};

export default Dashboard;
