import React, { useState } from "react";
import { __ } from "@wordpress/i18n";

const PostItem = ({ number }) => {
	// const [activeStatsPostId, setActiveStatsPostId] = useState(null);

	return <div className="mmd">{number}</div>;
};

export default PostItem;
