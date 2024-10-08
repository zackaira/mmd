import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";

const Dashboard = ({ mmdObj }) => {
	const [userStats, setUserStats] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchUserStats = async () => {
			try {
				const response = await fetch(`${mmdObj.apiUrl}mmd-api/v1/stats`, {
					headers: {
						"X-WP-Nonce": mmdObj.nonce,
					},
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error("Error response:", errorText);
					throw new Error(
						`HTTP error! status: ${response.status}, message: ${errorText}`
					);
				}

				const data = await response.json();

				setUserStats(data);
				setIsLoading(false);
			} catch (error) {
				console.error("Fetch error:", error);
				setError(error.message);
				setIsLoading(false);
			}
		};

		fetchUserStats();
	}, [mmdObj.apiUrl, mmdObj.nonce]);

	if (isLoading) {
		return <div>{__("Loading...", "mmd")}</div>;
	}

	if (error) {
		return (
			<div>
				<h2>{__("Error", "mmd")}</h2>
				<p>{error}</p>
				<p>{__("Please check the console for more details.", "mmd")}</p>
			</div>
		);
	}

	return (
		<div className="mmd-dash-stats">
			<h2>{__("User Statistics", "mmd")}</h2>
			<table>
				<thead>
					<tr>
						<th>{__("User ID", "mmd")}</th>
						<th>{__("Name", "mmd")}</th>
						<th>{__("Email", "mmd")}</th>
						<th>{__("Roles", "mmd")}</th>
						<th>{__("Route Count", "mmd")}</th>
					</tr>
				</thead>
				<tbody>
					{userStats.map((user) => (
						<tr key={user.user_id}>
							<td>{user.user_id}</td>
							<td>{user.name}</td>
							<td>{user.email}</td>
							<td>{user.roles.join(", ")}</td>
							<td>{user.route_count}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Dashboard;
