import React from "react";
import { __ } from "@wordpress/i18n";
import InputToggleSwitch from "./inputs/InputToggleSwitch";
import InputSelect from "./inputs/InputSelect";
import InputText from "./inputs/InputText";
import InputRange from "./inputs/InputRange";
import ColorPicker from "./inputs/ColorPicker";
import SettingTooltip from "./UI/SettingTooltip";
import { mmdConvertToSlug } from "../helpers";

import Heading from "./UI/Heading";

const SettingRow = (props) => {
	const theTitleSlug = props.slug
		? mmdConvertToSlug(props.slug)
		: mmdConvertToSlug(props.title);

	let theInput;
	if (props.inputType === "toggle") {
		theInput = <InputToggleSwitch {...props} />;
	} else if (props.inputType === "select") {
		theInput = <InputSelect {...props} />;
	} else if (props.inputType === "range") {
		theInput = <InputRange {...props} />;
	} else if (props.inputType === "colorpicker") {
		theInput = <ColorPicker {...props} />;
	} else if (props.inputType === "heading") {
		return (
			<tr className="mmd-row heading">
				<td colSpan={2}>
					<Heading {...props} />
				</td>
			</tr>
		);
	} else if (props.inputType === "pronote") {
		return (
			<tr className="mmd-row pronote">
				<th>&nbsp;</th>
				<td>
					{props.title && <h6>{props.title}:</h6>}
					{props.desc && <p>{props.desc}</p>}
				</td>
			</tr>
		);
	} else {
		theInput = <InputText {...props} />;
	}

	return (
		<React.Fragment>
			<tr className="mmd-row">
				<th scope="row">
					<label htmlFor={props.parent != "" ? theTitleSlug : props.value}>
						{props.title}
					</label>
				</th>
				<td>
					<div className="mmd-row-cols">
						<div className="mmd-row-col-left">
							{theInput}
							{props.note ? <p className="setting-note">{props.note}</p> : ""}
							{props.standOutNote && (
								<>
									<p className="stand-out-note">
										{props.standOutNote}
										<a
											href="options-permalink.php"
											className="stand-out-note-link"
											target="_blank"
										>
											{__("Update the Permalinks", "mmd")}
										</a>
									</p>
								</>
							)}
						</div>
						<div className="mmd-row-col-right">
							{props.tooltip && <SettingTooltip tooltip={props.tooltip} />}

							{props.documentation && (
								<a
									href={props.documentation}
									target="_blank"
									className="mmddoclink"
									title={__("Documentation", "mmd")}
								></a>
							)}
						</div>
					</div>
				</td>
			</tr>
		</React.Fragment>
	);
};

export default SettingRow;
