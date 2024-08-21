import { __ } from "@wordpress/i18n";

/*
 * Convert Text to slug
 */
export const mmdConvertToSlug = (text, spacer = "_") => {
	return text
		.toLowerCase()
		.replace(/[^\w ]+/g, "")
		.replace(/ +/g, spacer);
};

export const chartDefaults = {
	options: {
		chart: {
			zoom: {
				enabled: false,
			},
			toolbar: {
				show: false,
			},
			animations: {
				easing: "linear",
			},
		},
		legend: {
			position: "top",
			horizontalAlign: "right",
			floating: true,
			offsetY: -30,
		},
		tooltip: {
			enabled: false,
		},
		dataLabels: {
			enabled: true,
		},
		stroke: {
			width: 2,
			curve: "smooth",
		},
		title: {
			text: "Linkt Clicks",
			align: "left",
		},
		grid: {
			row: {
				colors: ["#f3f3f3", "transparent"],
				opacity: 0.5,
			},
		},
		colors: ["#1C4A70", "#47B9A0", "#5EC0B8", "#4979B5", "#72D1CF", "#365E8B"],
	},
};
export const chartDataDefaults = {
	series: [
		{
			name: "Clicks",
			data: [],
		},
	],
	options: {
		xaxis: {
			categories: [],
		},
	},
};

// Get ALL Linkts for the Post
export const getAllPostLinkts = async (apiUrl, id, period = "7_days", tag) => {
	if (!apiUrl || !id || !period) return [];

	const fetchPostLinkts = async () => {
		try {
			const response = await fetch(
				`${apiUrl}mmd-api/v1/get-mmds/${id}?period=${period}&tag=${tag}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (response.ok) {
				const tagsData = await response.json();
				return tagsData;
			} else {
				console.log("No Linkt data found for this post");
			}
		} catch (error) {
			console.error("Error fetching tags data:", error);
		}
		return [];
	};
	const tagData = await fetchPostLinkts();

	return tagData;
};

export const getUncategorizedLinkts = async (apiUrl, termIds) => {
	if (!apiUrl || !termIds) return [];

	const fetchPosts = async () => {
		try {
			const response = await fetch(
				`${apiUrl}wp/v2/mmd?mmds_exclude=${termIds.join(",")}&per_page=100`
			);
			if (response.ok) {
				const posts = await response.json();
				return posts;
			} else {
				console.log("No Uncategorized Linkts found");
			}
		} catch (error) {
			console.error("Error fetching Uncategorized Linkts:", error);
		}
		return [];
	};
	const uncatPosts = await fetchPosts();

	return uncatPosts;
};

// Sort Linkts to get possible Tag names and count
export const sortGetTagsCount = (data) => {
	const tagCounts = data.reduce((acc, obj) => {
		const tag = obj.tag_id || "default";
		if (acc[tag]) {
			acc[tag]++;
		} else {
			acc[tag] = 1;
		}
		return acc;
	}, {});

	return Object.keys(tagCounts).map((key) => ({
		name: key,
		count: tagCounts[key],
	}));
};

export const sortGetSelectedTagLinkts = (data, tag) => {
	if (data.length === 0) return [];

	const filteredData = data.filter((item) =>
		tag === "all" ? item : item.tag_id === tag
	);

	return filteredData;
};

export const getCategories = (period) => {
	const categories = [];
	const now = new Date();
	let date = new Date();

	switch (period) {
		case "7_days":
			for (let i = 6; i >= 0; i--) {
				date = new Date(now);
				date.setDate(now.getDate() - i);
				categories.push(
					new Intl.DateTimeFormat("default", {
						day: "2-digit",
						month: "short",
						year: "2-digit",
					}).format(date)
				);
			}
			break;
		case "14_days":
			for (let i = 13; i >= 0; i--) {
				date = new Date(now);
				date.setDate(now.getDate() - i);
				categories.push(
					new Intl.DateTimeFormat("default", {
						day: "2-digit",
						month: "short",
						year: "2-digit",
					}).format(date)
				);
			}
			break;
		case "30_days":
			for (let i = 29; i >= 0; i--) {
				date = new Date(now);
				date.setDate(now.getDate() - i);
				categories.push(
					new Intl.DateTimeFormat("default", {
						day: "2-digit",
						month: "short",
						year: "2-digit",
					}).format(date)
				);
			}
			break;
		case "3_months":
			for (let i = 2; i >= 0; i--) {
				date = new Date(now);
				date.setMonth(now.getMonth() - i);
				categories.push(
					date.toLocaleString("default", { month: "short", year: "numeric" })
				);
			}
			break;
		case "6_months":
			for (let i = 5; i >= 0; i--) {
				date = new Date(now);
				date.setMonth(now.getMonth() - i);
				categories.push(
					date.toLocaleString("default", { month: "short", year: "numeric" })
				);
			}
			break;
		case "12_months":
			for (let i = 11; i >= 0; i--) {
				date = new Date(now);
				date.setMonth(now.getMonth() - i);
				categories.push(
					date.toLocaleString("default", { month: "short", year: "numeric" })
				);
			}
			break;
		default:
			break;
	}
	return categories;
};

export const getTotalSeriesData = (data, period) => {
	const categories = getCategories(period);
	const seriesData = categories.map(() => 0);

	data.forEach((item) => {
		const visitDate = new Date(item.visit_time * 1000);

		let index;
		if (period.includes("days")) {
			const visitDateString = new Intl.DateTimeFormat("default", {
				day: "2-digit",
				month: "short",
				year: "2-digit",
			}).format(visitDate);
			index = categories.findIndex((category) => category === visitDateString);
		} else if (period.includes("months")) {
			const visitDateString = visitDate.toLocaleString("default", {
				month: "short",
				year: "numeric",
			});
			index = categories.findIndex((category) => category === visitDateString);
		}

		if (index >= 0) {
			seriesData[index]++;
		}
	});

	return seriesData;
};

export const getSeriesData = (data, tag, period) => {
	const categories = getCategories(period);
	const seriesData = categories.map(() => 0);

	data.forEach((item) => {
		const visitDate = new Date(item.visit_time * 1000);

		let index;
		if (period.includes("days")) {
			const visitDateString = new Intl.DateTimeFormat("default", {
				day: "2-digit",
				month: "short",
				year: "2-digit",
			}).format(visitDate);
			index = categories.findIndex((category) => category === visitDateString);
		} else if (period.includes("months")) {
			const visitDateString = visitDate.toLocaleString("default", {
				month: "short",
				year: "numeric",
			});
			index = categories.findIndex((category) => category === visitDateString);
		}

		if (index >= 0) {
			if (
				tag === "all" ||
				item.tag_id === tag ||
				(tag === "default" && !item.tag_id)
			) {
				seriesData[index]++;
			}
		}
	});

	return seriesData;
};

export const getAllSeriesData = (data, tagsArray, period) => {
	const series = tagsArray.map((tag) => ({
		name: tag.name || "default",
		data: getSeriesData(data, tag.name, period),
	}));

	return series;
};

/*
 * Sorting Functions
 */
export const sortLinktsDisplayBy = (data, sortBy = "title", sort = "asc") => {
	return data.sort((a, b) => {
		let valueA, valueB;

		if (sortBy === "title") {
			valueA = a.title.rendered.toLowerCase();
			valueB = b.title.rendered.toLowerCase();
		} else {
			valueA = a[sortBy];
			valueB = b[sortBy];
		}

		if (sort === "asc") {
			return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
		} else {
			return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
		}
	});
};

export const sortGetExtraArrayValues = (array1, array2) => {
	const names = array1.map((item) => item.name);
	const uniqueTagIds = new Set();

	array2.forEach((item) => {
		if (!names.includes(item.tag_id) && item.tag_id !== "default") {
			uniqueTagIds.add(item.tag_id);
		}
	});

	return Array.from(uniqueTagIds);
};

export const sortOnlyWithTagElements = (chartdata, tagsArray) => {
	const nameSet = new Set(tagsArray.map((item) => item.name));
	return chartdata.filter(
		(item) => nameSet.has(item.tag_id) || item.tag_id === "default"
	);
};

/*
 * Setting for the Blocks settings displayed in the admin dashboard
 */
export const blockListSettings = {
	button: {
		desc: __("Button blah blah", "mmd"),
		pluginSpecific: false,
		isNew: false,
	},
	disclosure: {
		desc: __("Add an affiliate disclosure blah blah", "mmd"),
		pluginSpecific: false,
		isNew: false,
	},
};

export const mmdGroupSettings = () => {
	const groupBtns = document.querySelectorAll(".mmd-group-btn");

	if (groupBtns) {
		groupBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				const btnParent = btn.parentElement;

				groupBtns.forEach((btnItem) => {
					btnItem.parentElement.removeAttribute("id", "openGroup");
					btnItem.parentElement.classList.remove("mmd-show");
				});

				// Add / Remove .mmd-show class
				if (btnParent.classList.contains("mmd-show")) {
					btnParent.removeAttribute("id", "openGroup");
					btnParent.classList.remove("mmd-show");
				} else {
					btnParent.setAttribute("id", "openGroup");
					btnParent.classList.add("mmd-show");
				}
			});
		});
	}

	// Close on click outside
	window.addEventListener("click", function (e) {
		const openGroup = document.getElementById("openGroup");

		if (openGroup) {
			if (!e.target == openGroup || !openGroup.contains(e.target)) {
				openGroup.removeAttribute("id");
				openGroup.classList.remove("mmd-show");
			}
		}
	});
};
