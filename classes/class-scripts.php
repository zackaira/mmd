<?php
/**
 * Scripts & Styles file
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Main plugin class.
 */
class MapMyDistance {
	/**
	 * The single instance of MMD
	 */
	private static $_instance = null; //phpcs:ignore

	/**
	 * The version number
	 */
	public $_version; //phpcs:ignore

	/**
	 * The main plugin file.
	 */
	public $file;

	/**
	 * Constructor funtion
	 */
	public function __construct($file = '', $version = MMD_PLUGIN_VERSION) {
		$this->file     = $file;
		$this->_version = $version;

		register_activation_hook( $this->file, array( $this, 'install' ) );

		// Register Scripts for plugin.
		add_action( 'init', array( $this, 'mmd_register_scripts' ), 10 );

		// Update/fix defaults on plugins_loaded hook
		add_action( 'plugins_loaded', array( $this, 'mmd_update_plugin_defaults' ) );

		// Load Frontend JS & CSS.
		add_action( 'wp_enqueue_scripts', array( $this, 'mmd_frontend_scripts' ), 10 );

		// Load Admin JS & CSS.
		add_action( 'admin_enqueue_scripts', array( $this, 'mmd_admin_scripts' ), 10, 1 );

		// Load Editor JS & CSS.
		add_action( 'enqueue_block_editor_assets', array( $this, 'mmd_block_editor_scripts' ), 10, 1 );

		$this->mmd_load_plugin_textdomain();
		add_action( 'init', array( $this, 'mmd_load_localisation' ), 0 );
	} // End __construct ()

	/**
	 * Register Scripts & Styles
	 */
	public function mmd_register_scripts() {
		$suffix = (defined('WP_DEBUG') && true === WP_DEBUG) ? '' : '.min';

		// Font Awesome Free
		wp_register_style('mmd-fontawesome', esc_url(MMD_PLUGIN_URL . 'assets/font-awesome/css/all.min.css'), array(), MMD_PLUGIN_VERSION);
		
		// MMD Frontend
		wp_register_style('mmd-frontend-style', esc_url(MMD_PLUGIN_URL . 'dist/frontend' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		// wp_register_script('mmd-frontend-script', esc_url(MMD_PLUGIN_URL . 'dist/frontend' . $suffix . '.js'), array(), MMD_PLUGIN_VERSION);
		// MMD Map Page
		wp_register_style('mmd-map-style', esc_url(MMD_PLUGIN_URL . 'dist/mmd' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		wp_register_script('mmd-map-script', esc_url(MMD_PLUGIN_URL . 'dist/mmd' . $suffix . '.js'), array(), MMD_PLUGIN_VERSION);

		// MMD User Account Routes Page
		wp_register_style('mmd-user-account-style', esc_url(MMD_PLUGIN_URL . 'dist/user-account' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		wp_register_script('mmd-user-account-script', esc_url(MMD_PLUGIN_URL . 'dist/user-account' . $suffix . '.js'), array(), MMD_PLUGIN_VERSION);

		// Settings JS
		wp_register_style('mmd-admin-settings-style', esc_url(MMD_PLUGIN_URL . 'dist/settings' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		wp_register_script('mmd-admin-settings-script', esc_url(MMD_PLUGIN_URL . 'dist/settings' . $suffix . '.js'), array('wp-i18n'), MMD_PLUGIN_VERSION, true);

		// Dashboard Widget
		wp_register_style('mmd-dashboard-style', esc_url(MMD_PLUGIN_URL . 'dist/dashboard' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		wp_register_script('mmd-dashboard-script', esc_url(MMD_PLUGIN_URL . 'dist/dashboard' . $suffix . '.js'), array('wp-i18n'), MMD_PLUGIN_VERSION, true);

		// MMD Post Type Dashboard List
		// wp_register_style('mmd-post-type-list-style', esc_url(MMD_PLUGIN_URL . 'dist/post-type-list' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		// wp_register_script('mmd-post-type-list-script', esc_url(MMD_PLUGIN_URL . 'dist/post-type-list' . $suffix . '.js'), array('wp-i18n'), MMD_PLUGIN_VERSION, true);

		// MMD Post Type Page
		// wp_register_style('mmd-post-type-style', esc_url(MMD_PLUGIN_URL . 'dist/post-type' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		// wp_register_script('mmd-post-type-script', esc_url(MMD_PLUGIN_URL . 'dist/post-type' . $suffix . '.js'), array('wp-i18n', 'wp-element', 'wp-data', 'wp-api-fetch'), MMD_PLUGIN_VERSION, true);
	} // End mmd_register_scripts ()

	/**
	 * Load frontend Scripts & Styles
	 */
	public function mmd_frontend_scripts() {
		$suffix = (defined('WP_DEBUG') && true === WP_DEBUG) ? '' : '.min';
		$mmdSavedOptions = get_option('mmd_options');
		$mmdOptions = $mmdSavedOptions ? json_decode($mmdSavedOptions) : '';
		$current_url = $_SERVER['REQUEST_URI'];

		// Frontend Styling
		wp_enqueue_style('mmd-frontend-style');

		// Retrieve user details
		if ( is_user_logged_in() ) {
			$user_id = get_current_user_id();
			$user_details = array(
				'user_id'    => $user_id,
				'first_name' => get_user_meta( $user_id, 'billing_first_name', true ),
				'last_name'  => get_user_meta( $user_id, 'billing_last_name', true ),
				'country'    => get_user_meta( $user_id, 'billing_country', true ),
				'activities' => get_user_meta( $user_id, 'activities', true ),
				'units'      => get_user_meta( $user_id, 'units', true ),
			);
		} else {
			$user_details = false;
		}

		// Map Page
		if( is_front_page() ) {
			$route_id = isset($_GET['route']) ? sanitize_text_field($_GET['route']) : '';

			wp_enqueue_style('mmd-map-style');
			wp_enqueue_script('mmd-map-script');
			wp_localize_script('mmd-map-script', 'mmdMapObj', array(
				'siteUrl' => esc_url(home_url()),
				'apiUrl' => esc_url(get_rest_url()),
				'nonce' => wp_create_nonce('wp_rest'),
				'userDetails' => $user_details,
				'routeId' => $route_id,
			));
		}

		// User Account - Routes Page
		if ( is_account_page() ) {
			wp_enqueue_style('mmd-user-account-style');
			wp_enqueue_script('mmd-user-account-script');
			wp_localize_script('mmd-user-account-script', 'mmdAccountObj', array(
				'siteUrl' => esc_url(home_url()),
				'apiUrl' => esc_url(get_rest_url()),
				'nonce' => wp_create_nonce('wp_rest'),
				'userDetails' => $user_details,
			));
		}
	} // End mmd_frontend_scripts ()

	/**
	 * Admin enqueue Scripts & Styles
	 */
	public function mmd_admin_scripts( $hook = '') {
		global $pagenow;
		$adminPage = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : $pagenow;
		$suffix = (defined('WP_DEBUG') && true === WP_DEBUG) ? '' : '.min';

		$mmdSavedOptions = get_option('mmd_options');
		$mmdOptions = $mmdSavedOptions ? json_decode($mmdSavedOptions) : '';
		$mmdDefaults = get_option('mmd_default_options');

		// Admin CSS
		wp_register_style('mmd-admin-style', esc_url(MMD_PLUGIN_URL . 'dist/admin' . $suffix . '.css'), array(), MMD_PLUGIN_VERSION);
		wp_enqueue_style('mmd-admin-style');

		// Admin JS
		wp_register_script('mmd-admin-script', esc_url(MMD_PLUGIN_URL . 'dist/admin' . $suffix . '.js'), array(), MMD_PLUGIN_VERSION, true);
		wp_localize_script('mmd-admin-script', 'mmdObj', array(
			'apiUrl' => esc_url( get_rest_url() ),
			'pluginUrl' => esc_url(MMD_PLUGIN_URL),
			'nonce' => wp_create_nonce('wp_rest'),
			// 'wcActive' => MMD_Admin::mmd_is_plugin_active('woocommerce.php'),
		));
		wp_enqueue_script('mmd-admin-script');

		wp_set_script_translations('mmd-admin-script', 'mmd', MMD_PLUGIN_DIR . 'lang');

		// Links Admin Settings Page
		if ('mmd-settings' == $adminPage) {
			wp_enqueue_style('mmd-admin-settings-style');
			
			wp_enqueue_script('mmd-admin-settings-script');
			wp_localize_script('mmd-admin-settings-script', 'mmdSetObj', array(
				'apiUrl' => esc_url(get_rest_url()),
				'nonce' => wp_create_nonce('wp_rest'),
				'accountUrl' => false,
				'upgradeUrl' => false,
				// 'wcActive' => MMD_Admin::mmd_is_plugin_active('woocommerce.php'),
				// 'pluginUrl' => esc_url(MMD_PLUGIN_URL),
				'mmdDefaults' => json_decode($mmdDefaults),
				'adminUrl' => esc_url(admin_url()),
			));
			// wp_enqueue_media();
		}

		// Dashboard Widget
		if ('index.php' === $adminPage) {
			wp_enqueue_style('mmd-dashboard-style');
			wp_enqueue_script('mmd-dashboard-script');
			wp_localize_script('mmd-dashboard-script', 'mmdDashObj', array(
				'apiUrl' => esc_url(get_rest_url()),
				'adminUrl' => esc_url(admin_url()),
				'nonce' => wp_create_nonce('wp_rest'),
			));
		}

		// Admin MMD Post Type List
		if ('mmd' === get_post_type() && 'edit.php' === $adminPage) {
			wp_enqueue_style('mmd-admin-list-style');
			wp_enqueue_script('mmd-admin-list-script');
		}
		
		// Admin MMD Post Type Page
		if ('mmd' === get_post_type() && ('post.php' === $adminPage || 'post-new.php' === $adminPage)) {
			wp_enqueue_style('mmd-admin-mmd-style');
			wp_enqueue_script('mmd-admin-mmd-script');
			wp_localize_script('mmd-admin-mmd-script', 'mmdPostObj', array(
				'apiUrl' => esc_url(get_rest_url()),
				'currentPostId' => 'post-new.php' === $adminPage ? null : get_the_ID(),
				'nonce' => wp_create_nonce('wp_rest'),
				'mmdOptions' => $mmdOptions->settings,
				'isPremium' => $isPremium,
			));
		}
		
		// var_dump('--------------------------------------------- ' . $adminPage);
		
		// Update the language file with this line in the terminal - "wp i18n make-pot ./ lang/mmd.pot"
		wp_set_script_translations('mmd-admin-settings-script', 'mmd', MMD_PLUGIN_DIR . 'lang');
		wp_set_script_translations('mmd-dashboard-script', 'mmd', MMD_PLUGIN_DIR . 'lang');
	} // End mmd_admin_scripts ()

	/**
	 * Load Block Editor Scripts & Styles
	 */
	public function mmd_block_editor_scripts() {
		$suffix = (defined('WP_DEBUG') && true === WP_DEBUG) ? '' : '.min';
		// $mmdSavedOptions = get_option('mmd_options');
		// $mmdOptions = $mmdSavedOptions ? json_decode($mmdSavedOptions) : '';
		
		wp_register_style('mmd-admin-editor-style', esc_url(MMD_PLUGIN_URL . 'dist/editor' . $suffix . '.css'), array('mmd-fontawesome'), MMD_PLUGIN_VERSION);
		wp_enqueue_style('mmd-admin-editor-style');

		// wp_register_script('mmd-admin-editor-script', esc_url(MMD_PLUGIN_URL . 'dist/editor' . $suffix . '.js'), array('wp-edit-post'), MMD_PLUGIN_VERSION, true);
		// wp_localize_script('mmd-admin-editor-script', 'mmdEditorObj', array(
		// 	'mmdOptions' => $mmdOptions,
		// ));
		// wp_enqueue_script('mmd-admin-editor-script');
	} // End mmd_block_editor_scripts ()

	/**
	 * Load plugin localisation
	 *
	 * @access  public
	 * @return  void
	 * @since   1.0.0
	 */
	public function mmd_load_localisation() {
		load_plugin_textdomain('mmd', false, MMD_PLUGIN_DIR . 'languages/');
	} // End mmd_load_localisation ()

	/**
	 * Load plugin textdomain
	 *
	 * @access  public
	 * @return  void
	 * @since   1.0.0
	 */
	public function mmd_load_plugin_textdomain() {
		$domain = 'mmd';
		$locale = apply_filters( 'plugin_locale', get_locale(), $domain );

		load_textdomain($domain, MMD_PLUGIN_DIR . 'lang/' . $domain . '-' . $locale . '.mo');
		load_plugin_textdomain($domain, false, MMD_PLUGIN_DIR . 'lang/');
	} // End mmd_load_plugin_textdomain ()

	/**
	 * Main MMD Instance
	 * Ensures only one instance of MMD is loaded or can be loaded.
	 */
	public static function instance( $file = '', $version = MMD_PLUGIN_VERSION) {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self( $file, $version );
		}

		return self::$_instance;
	} // End instance ()

	public static function mmdDefaults() {
		$initialSettings = array(
			"settings" => array(
				"chart_display" => "7_days",
			),
			"blocks" => array( // For adding a new block, update this AND ../src/backend/helpers.js AND class-notices.php newblocks number
				"disclosure" => true, // 2
				"button" => true, // 1
			),
		);
		return $initialSettings;
	}

	/**
	 * Update/Save the plugin version, defaults and settings if none exist | Run on 'plugins_loaded' hook
	 */
	public function mmd_update_plugin_defaults() {
		$defaultOptions = (object)$this->mmdDefaults();
		$objDefaultOptions = json_encode($defaultOptions);

		// Saved current Plugin Version if no version is saved
		if (!get_option('mmd_plugin_version') || (get_option('mmd_plugin_version') != MMD_PLUGIN_VERSION)) {
			update_option('mmd_plugin_version', MMD_PLUGIN_VERSION);
		}
		// Fix/Update Defaults if no defaults are saved or if defaults are different to previous version defaults
		if (!get_option('mmd_default_options') || (get_option('mmd_default_options') != $defaultOptions)) {
			update_option('mmd_default_options', $objDefaultOptions);
		}
		// Save new Plugin Settings from defaults if no settings are saved
		if (!get_option('mmd_options')) {
			update_option('mmd_options', $objDefaultOptions);
		}
	}

	/**
	 * Installation. Runs on activation.
	 */
	public function install() {
		$this->_update_default_settings();
		$this->_log_version_number();

		$this->mmd_create_custom_table();
	}

	/**
	 * Create custom database table for tracking visits.
	 */
	private function mmd_create_custom_table() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		$charset_collate = $wpdb->get_charset_collate();
	
		$sql = "CREATE TABLE IF NOT EXISTS $table_name (
			id CHAR(32) NOT NULL,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			route_name VARCHAR(255) NOT NULL,
			route_description TEXT,
			route_tags TEXT,
			route_activity VARCHAR(100),
			route_data LONGTEXT NOT NULL,
			created_at DATETIME NOT NULL,
			distance FLOAT NOT NULL,
			PRIMARY KEY (id),
			INDEX idx_user_id (user_id),
			INDEX idx_created_at (created_at)
		) $charset_collate;";
	
		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}

	/**
	 * Save Initial Default Settings.
	 */
	private function _update_default_settings() { //phpcs:ignore
		$defaultOptions = (object)$this->mmdDefaults();
		
		update_option('mmd_options', json_encode($defaultOptions));
		update_option('mmd_default_options', json_encode($defaultOptions));
	}
	/**
	 * Log the plugin version number.
	 */
	private function _log_version_number() { //phpcs:ignore
		update_option('mmd_plugin_version', MMD_PLUGIN_VERSION);
	}
}
