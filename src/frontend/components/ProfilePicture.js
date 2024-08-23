import React, { useCallback, useMemo } from "react";
import { __ } from "@wordpress/i18n";

const ProfilePicture = ({ mmdObj }) => {
	// const [imageUrl, setImageUrl] = useState(null);
	// const [isUploading, setIsUploading] = useState(false);
	const userInitials = mmdObj.userDetails
		? getUserInitials(
				mmdObj.userDetails.first_name,
				mmdObj.userDetails.last_name
		  )
		: "U";

	function getUserInitials(firstName, lastName) {
		const firstInitial = firstName.charAt(0).toUpperCase();
		const lastInitial = lastName.charAt(0).toUpperCase();
		return firstInitial + lastInitial;
	}

	const getRandomGreenShade = useCallback(() => {
		const hue = Math.floor(Math.random() * 40) + 120; // Range from 120 to 160 (more focused green hues)
		const saturation = Math.floor(Math.random() * 20) + 60; // Range from 60% to 80%
		const lightness = Math.floor(Math.random() * 15) + 20; // Range from 20% to 35%
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}, []);

	// useEffect(() => {
	// 	fetchProfilePicture();
	// }, []);

	// const fetchProfilePicture = async () => {
	// 	try {
	// 		const response = await fetch(
	// 			`${mmdObj.apiUrl}mmd-api/v1/get-profile-picture/${mmdObj.userDetails.id}`,
	// 			{
	// 				headers: {
	// 					"Content-Type": "application/json",
	// 					"X-WP-Nonce": mmdObj.nonce,
	// 				},
	// 			}
	// 		);
	// 		if (response.ok) {
	// 			const data = await response.json();
	// 			setImageUrl(data.url);
	// 		}
	// 	} catch (error) {
	// 		console.error("Error fetching profile picture:", error);
	// 	}
	// };

	// const handleFileChange = async (event) => {
	// 	const file = event.target.files[0];
	// 	if (file) {
	// 		setIsUploading(true);
	// 		const formData = new FormData();
	// 		formData.append("file", file);

	// 		try {
	// 			const response = await fetch(
	// 				`${mmdObj.apiUrl}mmd-api/v1/upload-profile-picture/${mmdObj.userDetails.id}`,
	// 				{
	// 					method: "POST",
	// 					body: formData,
	// 					headers: {
	// 						"Content-Type": "application/json",
	// 						"X-WP-Nonce": mmdObj.nonce,
	// 					},
	// 				}
	// 			);

	// 			if (response.ok) {
	// 				const data = await response.json();
	// 				setImageUrl(data.url);
	// 			} else {
	// 				console.error("Upload failed");
	// 			}
	// 		} catch (error) {
	// 			console.error("Error uploading profile picture:", error);
	// 		} finally {
	// 			// setIsUploading(false);
	// 		}
	// 	}
	// };

	const backgroundColor = useMemo(
		() => getRandomGreenShade(),
		[getRandomGreenShade]
	);

	return (
		<div className="mmd-profile-pic">
			<div className="mmd-pp-placeholder" style={{ backgroundColor }}>
				{userInitials}
			</div>

			{/* {imageUrl ? (
				<img
					src={imageUrl}
					alt="Profile Picture"
					style={{ maxWidth: "150px", height: "auto", borderRadius: "50%" }}
				/>
			) : (
				<div className="mmd-pp-placeholder">{userInitials}</div>
			)}
			<input
				type="file"
				id="mmd-pp-upload"
				accept="image/*"
				onChange={handleFileChange}
			/>
			<label htmlFor="mmd-pp-upload" className="button">
				{isUploading
					? __("Uploading...", "mmd")
					: __("Upload New Picture", "mmd")}
			</label> */}
		</div>
	);
};

export default ProfilePicture;
