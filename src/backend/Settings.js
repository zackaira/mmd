// Localized JS object - mmdObj
import React, { useState, useEffect, useRef } from "react";
import { __ } from "@wordpress/i18n";
import axios from "axios";
import SettingRow from "./components/SettingRow";
// import SettingGroup from "./components/SettingGroup";
import SettingBlock from "./components/SettingBlock";
import SettingHeader from "./components/SettingHeader";
import GiveFeedback from "./components/GiveFeedback";
import InfoTab from "./InfoTab";
import Loader from "./Loader";
import { mmdGroupSettings, blockListSettings } from "./helpers";

const Settings = ({ mmdObj }) => {
	const url = `${mmdObj.apiUrl}mmd-api/v1`;
	const [loader, setLoader] = useState(false);
	const [loadSetting, setLoadSetting] = useState(true);
	const [activeTab, setActiveTab] = useState("1");
	// const isPremium = Boolean(mmdObj.isPremium);
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
		<React.Fragment>
			<div className="mmd-settings">
				<div className="mmdSettingBar">
					<h2>
						{isPremium
							? __("Linkt Pro Settings", "mmd")
							: __("Linkt Settings", "mmd")}
					</h2>
					<div className="mmdSettingBarOptions">
						{/* <a
							href={mmdObj.accountUrl}
							className="fa-regular fa-user mmd-account"
							title={__("My Account", "mmd")}
						></a> */}
						<a
							href={
								mmdObj.adminUrl +
								"edit.php?post_type=mmd&page=mmd-license"
							}
							className={`fa-solid fa-key mmd-upgrade`}
							title={__("Upgrade to Linkt Pro", "mmd")}
						></a>
						{/* <a
							href={mmdObj.accountUrl}
							className="fa-solid fa-life-ring mmd-docs"
							title={__("Documentation", "mmd")}
							target="_blank"
						></a> */}
					</div>
				</div>

				{Object.keys(mmdOptions).length > 0 &&
					!mmdOptions.disablerating && (
						<GiveFeedback
							mmdOptions={mmdOptions}
							clickClose={handleChange}
						/>
					)}

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
										{__("Settings", "mmd")}
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

								<li className="help">
									<a
										id="mmdtab-help"
										className={`mmd-tab ${
											activeTab === "help" ? "active" : ""
										}`}
										onClick={() => changeTab("help")}
									>
										{isPremium ? __("Help", "mmd") : __("Go Pro", "mmd")}
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
											title={__("Linkt Settings", "mmd")}
											description={__(
												"Adjust your default settings for Linkt and turn on/off certain features.",
												"mmd"
											)}
										/>

										<table className="form-table" role="presentation">
											<tbody>
												<SettingRow
													title={__("URL Extension", "mmd")}
													slug="settings_url_ext"
													value={mmdOptions.settings?.url_ext}
													placeholder="go"
													inputType="text"
													onChange={handleChange}
													note={__(
														"Suggestions: recommends, suggests, visit, explore, discover, refer, view",
														"mmd"
													)}
													{...(mmdUrlVal
														? {
																standOutNote: __(
																	"After editing the URL Extension",
																	"mmd"
																),
														  }
														: {})}
												/>

												<SettingRow
													title={__("Dashboard Widget Display", "mmd")}
													slug="settings_dash_display"
													value={mmdOptions.settings?.dash_display}
													inputType="select"
													options={{
														single: __("As Single Linkts", "mmd"),
														categs: __("Grouped in Categories", "mmd"),
													}}
													onChange={handleChange}
												/>
												{/* {!isPremium &&
													mmdOptions.settings?.dash_display === "categs" && (
														<>
															<SettingRow
																title={__("PROOOOO", "mmd")}
																slug="settings_promote"
																value={
																	"PROMOTE PREMIUM FEATURE YES YES YES !!!!"
																}
																inputType="text"
																onChange={handleChange}
															/>
														</>
													)} */}

												<SettingRow
													title={__("Order By", "mmd")}
													slug="settings_chart_order_by"
													value={mmdOptions.settings?.chart_order_by}
													inputType="select"
													options={{
														title:
															mmdOptions.settings?.dash_display === "categs"
																? __("Category Names & Post Titles")
																: __("Post Titles"),
														...{
															...(mmdOptions.settings?.dash_display ===
															"single"
																? { total_clicks: __("Click Count") }
																: {}),
														},
													}}
													onChange={handleChange}
												/>
												<SettingRow
													title={__("Order", "mmd")}
													slug="settings_chart_order"
													value={mmdOptions.settings?.chart_order}
													inputType="select"
													options={{
														asc: __("Ascending", "mmd"),
														desc: __("Descending", "mmd"),
													}}
													onChange={handleChange}
												/>

												<SettingRow
													title={__("Chart Display", "mmd")}
													slug="settings_chart_display"
													value={mmdOptions.settings?.chart_display}
													inputType="select"
													options={{
														"7_days": __("Last 7 Days", "mmd"),
														"14_days": __("Last 2 Weeks", "mmd"),
														"30_days": __("Last 30 Days", "mmd"),
														"3_months": __("Last 3 Months", "mmd"),
														"12_months": __("Last 12 Months", "mmd"),
													}}
													onChange={handleChange}
												/>

												{/* {!isPremium && (
													<>
														<SettingRow
															title={__("PROOOOO", "mmd")}
															slug="settings_promotes"
															value={"PROMOTE PREMIUM FEATURE YES YES YES !!!!"}
															inputType="text"
															onChange={handleChange}
														/>
													</>
												)} */}

												<SettingRow
													title={__("Enable Chart", "mmd")}
													slug="settings_chart_enabled"
													value={mmdOptions.settings?.chart_enabled}
													inputType="toggle"
													onChange={handleChange}
												/>
												<SettingRow
													title={__("Track Logged In Users", "mmd")}
													slug="settings_track_loggedin"
													value={mmdOptions.settings?.track_loggedin}
													inputType="toggle"
													onChange={handleChange}
													note={__(
														"For websites with user accounts, also track users that are logged in.",
														"mmd"
													)}
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

										<div className="blockons-block-settings">
											{mmdDefaults.blocks &&
												mmdOptions &&
												Object.entries(mmdDefaults.blocks).map(
													([key, value]) => (
														<SettingBlock
															key={key}
															title={key
																.replaceAll("_", " ")
																.replace("wc", "WC")}
															slug={`blocks_${key}`}
															value={
																// If the setting exists in the saved settings then use it otherwise off by default
																mmdOptions && mmdOptions.blocks
																	? mmdOptions.blocks[key]
																	: false
															}
															inputType="toggle"
															description={
																blockListSettings[key]
																	? blockListSettings[key].desc
																	: ""
															}
															onChange={handleChange}
															pluginSpecific={
																blockListSettings[key]
																	? blockListSettings[key].pluginSpecific
																	: false
															}
															{...(blockListSettings[key] &&
															blockListSettings[key].pluginSpecific ===
																"WooCommerce" &&
															!wcActive
																? { disable: true }
																: "")}
															isNew={
																blockListSettings[key]
																	? blockListSettings[key].isNew
																	: false
															}
														/>
													)
												)}
										</div>
									</div>

									<div
										id="mmd-content-help"
										className={`mmd-content ${
											activeTab === "help" ? "active" : ""
										}`}
									>
										<InfoTab
											adminUrl={mmdObj.adminUrl}
											isPro={isPremium}
											// upgrade={mmdObj.upgradeUrl}
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
		</React.Fragment>
	);
};

export default Settings;
