import React, { useState, useEffect } from "react";

const savedRoutes = [
	{
		name: "Route 1",
		description: "Route 1 description",
		distance: 10.5,
		date: "2021-09-01",
		routeId: 1,
		userId: 1,
	},
	{
		name: "Route 2",
		description: "Route 2 description",
		distance: 15.5,
		date: "2021-09-02",
		routeId: 2,
		userId: 1,
	},
	{
		name: "Route 3",
		description: "Route 3 description",
		distance: 20.5,
		date: "2021-09-03",
		routeId: 3,
		userId: 1,
	},
	{
		name: "Route 6",
		description: "Route 66 description",
		distance: 45.5,
		date: "2021-09-02",
		routeId: 82,
		userId: 1,
	},
	{
		name: "Route 11",
		description: "Route 121 description",
		distance: 28.5,
		date: "2021-09-03",
		routeId: 33,
		userId: 1,
	},
];

const AccountRoutes = ({ mmdObj }) => {
	const [isLoading, setIsLoading] = useState(false);

	console.log("Routes Page mmdObj: ", mmdObj);

	if (isLoading) return <p>Loading...</p>;

	return (
		<div className="mmd-routes">
			<h2>ROUTES</h2>
			{savedRoutes?.length > 0 ? (
				<div className="mmd-user-routes">
					{savedRoutes.map((route) => (
						<div key={route.routeId} className="mmd-route">
							<h3>{route.name}</h3>
							<p>{route.description}</p>
							<div>{route.distance}</div>
							<div>{route.date}</div>
							<div>
								<span className="fa-solid fa-edit mmd-route-icon edit"></span>
								<span className="fa-solid fa-trash-can mmd-route-icon delete"></span>
								<span className="fa-solid fa-copy mmd-route-icon copy"></span>
							</div>
						</div>
					))}
				</div>
			) : (
				<p>No routes found.</p>
			)}
		</div>
	);
};

export default AccountRoutes;
