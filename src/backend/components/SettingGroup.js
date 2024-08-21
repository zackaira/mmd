import React from "react";

const SettingGroup = ({ label, children }) => {
	return (
		<React.Fragment>
			<tr className="mmd-row mmd-group-row">
				<th>{label}</th>
				<td>
					<div className="mmd-group">
						<a className="mmd-group-btn">
							<span className="dashicons dashicons-edit"></span>
						</a>
						<div className="mmd-group-container">
							<table className="form-table" role="presentation">
								<tbody>{children}</tbody>
							</table>
						</div>
					</div>
				</td>
			</tr>
		</React.Fragment>
	);
};

export default SettingGroup;
