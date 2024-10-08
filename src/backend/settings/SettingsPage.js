// Localized JS object - mmdObj
import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import axios from "axios";
import SettingRow from "../components/SettingRow";
// import SettingGroup from "./components/SettingGroup";
import SettingHeader from "../components/SettingHeader";
import Loader from "../Loader";
import { mmdGroupSettings, blockListSettings } from "../helpers";

const SettingsPage = ({ mmdObj }) => {
	const url = `${mmdObj.apiUrl}mmd-api/v1`;
	const [loader, setLoader] = useState(false);
	const [loadSetting, setLoadSetting] = useState(true);
	const [activeTab, setActiveTab] = useState("1");
	const isPremium = Boolean(mmdObj.isPremium);
	// const wcActive = Boolean(mmdObj.wcActive);
	const mmdDefaults = mmdObj.mmdDefaults;

	console.log(mmdDefaults);

	const [mmdOptions, setLinktOptions] = useState({});
	const [mmdUrlVal, setLinktUrlVal] = useState(false);

	const changeTab = (tabId) => {
		setActiveTab(tabId);
	};

	// setState dynamically for each setting
	const handleChange = ({
		target: { type, checked, name, value, className },
	}) => {
		if (
			type === "checkbox" &&
			(className === "checkbox-single" ||
				className === "toggle-switch-checkbox")
		)
			value = checked;

		const settingGroup = name.substring(0, name.indexOf("_")); // Splits by the first _ and saves that as the group name
		const settingName = name.substring(name.indexOf("_") + 1); // Setting name within group, anything after the first _

		const groupKey = settingGroup === "global" ? name.substring(7) : name;

		setLinktOptions({
			...mmdOptions,
			...(!settingGroup || settingGroup === "global" // sn_ name gets saved as default / in no group
				? { [groupKey]: value }
				: {
						[settingGroup]: {
							...mmdOptions[settingGroup],
							[settingName]: value,
						},
				  }),
		});
	};

	console.log(mmdOptions);

	useEffect(() => {
		mmdGroupSettings();
	}, [mmdOptions]);

	// Submit form
	const handleSubmit = (e) => {
		e.preventDefault();
		setLoader(true);

		axios
			.post(
				url + "/settings",
				{
					mmdOptions: JSON.stringify(mmdOptions),
				},
				{
					// Add Nonce to prevent this working elsewhere
					headers: {
						"content-type": "application/json",
						"X-WP-NONCE": mmdObj.nonce,
					},
				}
			)
			.then((res) => {
				// console.log(res.data);
				// const mmdOptions = JSON.parse(res.data.mmdOptions);
				if (res.data === "Successful") setLinktUrlVal(true);
				setLoader(false);
			});
	};

	const confirmDelete = (e) => {
		const deleteBtn = document.getElementsByClassName("mmd-delete");
		deleteBtn[0].classList.add("show-confirm");
		setTimeout(function () {
			deleteBtn[0].classList.remove("show-confirm");
		}, 2500);
	};

	const handleDeleteOptions = (e) => {
		e.preventDefault();
		if (
			window.confirm(
				__("Are you sure you want to delete all settings?", "mmd")
			)
		) {
			setLoader(true);
			setLoadSetting(true);
			axios
				.delete(url + "/delete", {
					headers: {
						"X-WP-NONCE": mmdObj.nonce,
					},
				})
				.then((res) => {
					setLoader(false);
					location.reload();
				});
		}
	};

	// Get Settings from db
	useEffect(() => {
		axios
			.get(url + "/settings")
			.then((res) => {
				const mmdOptions = res.data
					? JSON.parse(res.data)
					: console.log("Linkt Options Empty");

				// setState dynamically for all settings
				if (mmdOptions) {
					for (const key in mmdOptions) {
						setLinktOptions((prevState) => ({
							...prevState,
							[key]: mmdOptions[key] ? mmdOptions[key] : "",
						}));
					}
				} else {
					setLinktOptions(mmdDefaults); // Set settings to mmdDefaults if not found
					// document.querySelector(".mmdSaveBtn").click();
				}
				// console.log(mmdOptions);
			})
			.then(() => {
				setLoadSetting(false);
			});
	}, []);

	return (
		<div className="mmd-settings">
			<div className="mmdSettingBar">
				<h2>
					{__("MMD Settings", "mmd")}
				</h2>
				{/* <div className="mmdSettingBarOptions">
				</div> */}
			</div>

			<div className="mmd-settings-content">
				<form id="mmd-settings-form" onSubmit={(e) => handleSubmit(e)}>
					<div className="mmd-tabs">
						<ul>
							<li>
								<a
									id="mmdtab-1"
									className={`mmd-tab ${activeTab === "1" ? "active" : ""}`}
									onClick={() => changeTab("1")}
								>
									{__("Event Types", "mmd")}
								</a>
							</li>
							<li>
								<a
									id="mmdtab-2"
									className={`mmd-tab ${activeTab === "2" ? "active" : ""}`}
									onClick={() => changeTab("2")}
								>
									{__("Blocks", "mmd")}
								</a>
							</li>
						</ul>

						<div className="mmd-content-wrap">
							<div className="mmd-content-wrap-inner">
								{(loadSetting || loader) && <Loader />}
								<div
									id="mmd-content-1"
									className={`mmd-content ${
										activeTab === "1" ? "active" : ""
									}`}
								>
									<SettingHeader
										title={__("MMD Event Types", "mmd")}
										description={__(
											"Add/Remove Event Types. This is for when a user applies to make a route public.",
											"mmd"
										)}
									/>

									<table className="form-table" role="presentation">
										<tbody>
											<SettingRow
												title={__("MMD Event Types", "mmd")}
												slug="settings_event_types"
												value={mmdOptions.settings?.event_types}
												inputType="repeater"
												onChange={handleChange}
											/>
										</tbody>
									</table>


								</div>

								<div
									id="mmd-content-2"
									className={`mmd-content ${
										activeTab === "2" ? "active" : ""
									}`}
								>
									<SettingHeader
										title={__("Blockons Editor Blocks", "blockons")}
										description={__(
											"Choose the blocks you'd like to use when building with the WordPress block editor. You can turn off blocks to optimize for speed & page loading.",
											"blockons"
										)}
									/>

									
								</div>
							</div>

							<div className="mmdSettingBar bottom">
								<div className="mmdSettingBarMain">
									<button
										type="submit"
										className="button mmdSaveBtn button-primary"
									>
										{__("Save Settings", "mmd")}
									</button>
									<div className="mmdSaveBtnLoader">
										{(loadSetting || loader) && <Loader />}
									</div>

									{mmdUrlVal && (
										<a
											href="options-permalink.php"
											className="stand-out-note-link"
											target="_blank"
										>
											{__("Update the Permalinks", "mmd")}
										</a>
									)}
								</div>
								<div className="mmdSettingBarOptions">
									<div
										className="mmd-delete"
										title={__("Reset Settings", "mmd")}
										onClick={confirmDelete}
									>
										<div className="mmd-confirm-delete">
											<a onClick={handleDeleteOptions}>
												{__("Confirm... Reset All Settings!", "mmd")}
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SettingsPage;
