import React, { useEffect, useRef, useState } from "react";
import Trix from "trix";
import "trix/dist/trix.css";

const MMDTrixEditor = ({ initialContent, onChange }) => {
	const trixEditorRef = useRef(null);
	const isUserEditingRef = useRef(false);
	const [trixContent, setTrixContent] = useState(initialContent);
	const previousContentRef = useRef(initialContent);

	useEffect(() => {
		if (trixEditorRef.current && trixEditorRef.current.editor) {
			const trixEditor = trixEditorRef.current.editor;

			if (
				!isUserEditingRef.current &&
				initialContent !== previousContentRef.current
			) {
				trixEditor.loadHTML(initialContent);
				setTrixContent(initialContent);
				previousContentRef.current = initialContent;
			}
		}
	}, [initialContent]);

	useEffect(() => {
		if (trixEditorRef.current) {
			const trixEditor = trixEditorRef.current;

			// Remove unwanted buttons
			trixEditor.toolbarElement
				.querySelector(".trix-button--icon-attach")
				?.remove();
			trixEditor.toolbarElement
				.querySelector(".trix-button-group--file-tools")
				?.remove();
			trixEditor.toolbarElement
				.querySelector(".trix-button-group-spacer")
				?.remove();
			trixEditor.toolbarElement
				.querySelector(".trix-button-group--history-tools")
				?.remove();

			// Set up event listener for Trix changes
			const handleTrixChange = () => {
				isUserEditingRef.current = true;
				const newContent = trixEditor.innerHTML;
				setTrixContent(newContent);
				onChange(newContent);
				setTimeout(() => {
					isUserEditingRef.current = false;
				}, 0);
			};

			trixEditor.addEventListener("trix-change", handleTrixChange);

			// Clean up event listener
			return () => {
				trixEditor.removeEventListener("trix-change", handleTrixChange);
			};
		}
	}, [onChange]);

	return (
		<>
			<trix-editor
				ref={trixEditorRef}
				input="trix-input"
				className="trix-content"
			></trix-editor>
			<input id="trix-input" type="hidden" value={trixContent} />
		</>
	);
};

export default MMDTrixEditor;
