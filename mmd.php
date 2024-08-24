<?php
/**
 * Plugin Name: Map My Distance
 * Version: 1.0.2
 * Plugin URI: https://zackaira.com/wordpress-plugins/mmd/
 * Description: A Map Routes plugin for Map My distance
 * Author: Kaira
 * Author URI: https://zackaira.com/
 * Requires at least: 5.0
 * Tested up to: 6.6
 * Text Domain: mmd
 * Domain Path: /lang/
 *
 * @package mmd
 */
defined( 'ABSPATH' ) || exit;

if ( !defined( 'MMD_PLUGIN_VERSION' ) ) {
	define('MMD_PLUGIN_VERSION', '1.0.2');
}
if ( !defined( 'MMD_PLUGIN_URL' ) ) {
	define('MMD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}
if ( !defined( 'MMD_PLUGIN_DIR' ) ) {
	define('MMD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

require_once 'classes/class-scripts.php';
require_once 'classes/class-rest-api.php';
require_once 'classes/class-admin.php';
require_once 'classes/class-notices.php';
require_once 'classes/class-frontend.php';

/**
 * Main instance of MapMyDistance_Admin to prevent the need to use globals
 *
 * @since  1.0.0
 * @return object MapMyDistance_Admin
 */
function mmd() {
	$instance = MapMyDistance::instance( __FILE__, MMD_PLUGIN_VERSION );
	return $instance;
}
mmd();