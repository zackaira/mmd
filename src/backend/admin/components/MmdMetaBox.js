import { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import InputText from "../../components/inputs/InputText";
import {
	mmdConvertToSlug,
	getAllPostLinkts,
	sortGetExtraArrayValues,
} from "../../helpers";
import Loader from "../../Loader";

const LinktMetaBox = ({ mmdObj }) => {
	const apiUrl = mmdObj.apiUrl;
	const currentPostId = mmdObj.currentPostId;
	const [isLoading, setIsLoading] = useState(true);
	const [postData, setPostData] = useState({});

	useEffect(() => {
		fetchPostData();
	}, [currentPostId]);

	const fetchPostData = async () => {
		if (currentPostId) {
			try {
				const response = await fetch(`${apiUrl}wp/v2/mmd/${currentPostId}`, {
					headers: {
						"X-WP-Nonce": mmdObj.nonce,
					},
					credentials: "same-origin", // Ensure cookies are sent with the request
				});

				if (response.ok) {
					const data = await response.json();

					const result = {
						id: data.id,
						link: data.link,
						total_clicks: data.total_clicks,
					};
					setPostData(result);

					// console.log("Post Linkts:", postLinkts);
				} else {
					console.error("Error fetching post data:", response);
				}
			} catch (error) {
				console.error("Error fetching post data:", error);
			}
		} else {
			console.log("Linkt: No current post ID set");
		}
		setIsLoading(false);
	};

	if (isLoading) {
		return (
			<div className="mmd-loading">
				<Loader height={35} width={35} />
			</div>
		);
	}

	if (!currentPostId || !showMetaBox) return;

	return (
		<div className="mmd-meta-box">
			<div>mmd react</div>
		</div>
	);
};

export default LinktMetaBox;
