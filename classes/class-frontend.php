<?php
/**
 * Frontend functions.
 */
if (!defined('ABSPATH')) { exit; }

/**
 * Frontend class.
 */
class MapMyDistance_Frontend {
	/**
	 * Constructor function.
	 */
	public function __construct() {
		// $mmdSavedOptions = get_option('mmd_options');
		// $mmdOptions = $mmdSavedOptions ? json_decode($mmdSavedOptions) : '';

		// add_filter('body_class', array( $this, 'mmd_frontend_body_classes' ));
	}

	/**
	 * Set body class for Free & Pro versions.
	 */
	// public function mmd_frontend_body_classes($classes) {
	// 	if ( mmd_fs()->can_use_premium_code__premium_only() ) {
	// 		$classes[] = sanitize_html_class('mmd-pro');
	// 	} else {
	// 		$classes[] = sanitize_html_class('mmd-free');
	// 	}
	// 	return $classes;
	// }
}
new MapMyDistance_Frontend();
