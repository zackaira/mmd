<?php
/**
 * Admin Settings & Setup file.
 */
if (!defined('ABSPATH')) { exit; }

/**
 * Admin class.
 */
class MapMyDistance_Admin {
	/**
	 * Constructor function.
	 */
	public function __construct() {
		add_action('admin_menu', array( $this, 'mmd_create_admin_menu' ), 10, 1);

		add_filter('block_categories_all', array($this, 'mmd_blocks_custom_category'), 10, 2);

		add_filter('admin_body_class', array($this, 'mmd_admin_body_classes'));

		// Regsiter post type
		// add_action('init' , array( $this, 'mmd_register_post_type' ));

		// MMD Edit Screen
		// add_action('admin_menu', array( $this, 'mmd_post_type_meta_box' ));

		// MMD List Screen
		// add_filter('manage_edit-mmd_columns', array( $this, 'mmd_post_list_columns' ));
		// add_action('manage_posts_custom_column', array( $this, 'mmd_post_list_columns_detail' ));

		// add_action('save_post', array( $this, 'mmd_save_post_meta' ));

		// Add Dashboard Widget
		add_action('wp_dashboard_setup', array( $this, 'mmd_dashboard_widget' ));
	}

	/**
	 * Create an Admin Sub-Menu under WooCommerce
	 */
	public function mmd_create_admin_menu() {
		$capability = 'manage_options';
		$slug = 'mmd-settings';

		add_submenu_page(
			'edit.php?post_type=mmd',
			__('Settings', 'mmd'),
			__('Settings', 'mmd'),
			$capability,
			$slug,
			array($this, 'mmd_menu_page_template')
		);
	}

	/**
	 * Create the Page Template html for React
	 * Settings created in ../src/backend/settings/admin.js
	 */
	public function mmd_menu_page_template() {
		$allowed_html = array(
			'div' => array('class' => array(), 'id' => array()),
			'h2' => array(),
		);

		$html  = '<div class="wrap">' . "\n";
		$html .= '<h2> </h2>' . "\n";
		$html .= '<div id="mmd-root"></div>' . "\n";
		$html .= '</div>' . "\n";

		echo wp_kses($html ,$allowed_html);
	}

	/**
	 * Create MMD blocks Category
	 */
	public function mmd_blocks_custom_category($categories, $post) {
		return array_merge(
			$categories,
			array(
				array(
					"slug" => "mmd-category",
					"title" => __("MMD Blocks", "mmd"),
				)
			)
		);
	}

	/**
	 * Function to check for active plugins
	 */
	public static function mmd_is_plugin_active($plugin_name) {
		// Get Active Plugin Setting
		$active_plugins = (array) get_option('active_plugins', array());
		if (is_multisite()) {
			$active_plugins = array_merge($active_plugins, array_keys(get_site_option( 'active_sitewide_plugins', array())));
		}

		$plugin_filenames = array();
		foreach ($active_plugins as $plugin) {
			if (false !== strpos( $plugin, '/') ) {
				// normal plugin name (plugin-dir/plugin-filename.php)
				list(, $filename ) = explode( '/', $plugin);
			} else {
				// no directory, just plugin file
				$filename = $plugin;
			}
			$plugin_filenames[] = $filename;
		}
		return in_array($plugin_name, $plugin_filenames);
	}

	/**
	 * Function to check for active plugins
	 */
	public function mmd_admin_body_classes($admin_classes) {
		$lsProOptions = json_decode(get_option('mmd_license_message'));
		$isPremium = isset( $lsProOptions->data->activated ) ? (bool) $lsProOptions->data->activated : false;

		if ($isPremium) {
			$admin_classes .= ' ' . sanitize_html_class('mmd-pro');
		} else {
			$admin_classes .= ' ' . sanitize_html_class('mmd-free');
		}
		return $admin_classes;
	}

	/**
	 * Register new post type
	 * @return void
	 */
	public function mmd_register_post_type() {
		$labels = array(
			'name'               => __( 'Route', 'mmd' ),
			'singular_name'      => __( 'Route', 'mmd' ),
			'add_new'            => __( 'Add New', 'mmd' ),
			'add_new_item'       => __( 'Add New', 'mmd' ),
			'new_item'           => __( 'New Route', 'mmd' ),
			'edit_item'          => __( 'Edit Route', 'mmd' ),
			'view_item'          => __( 'View Route', 'mmd' ),
			'all_items'          => __( 'All Routes', 'mmd' ),
			'search_items'       => __( 'Search Routes', 'mmd' ),
			'parent_item_colon'  => __( 'Parent Routes:', 'mmd' ),
			'not_found'          => __( 'No Route found.', 'mmd' ),
			'not_found_in_trash' => __( 'No Route found in Trash.', 'mmd' )
		);
	
		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Description.', 'mmd' ),
			'public'             => true, // false
			'publicly_queryable' => true, // false
			'exclude_from_search'=> true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true, // false
			'query_var' => true,
			'can_export' => true,
			'rewrite' => array(
				'slug' => apply_filters( 'mmd_slug_prefix', 'go' ),
				'with_front' => false,
			),
			'capability_type'    => 'post',
			'has_archive'        => true, // false
			'hierarchical'       => false,
			'show_in_rest' 		 => true,
			'rest_base'			 => 'mmd',
	  		'rest_controller_class' => 'WP_REST_Posts_Controller',
			'menu_position'      => 101,
			'supports'           => array( 'title' )
		);

		// Create Categories
		register_taxonomy(
		    'routes',
		    'route',
		    array(
		        'hierarchical' => true,
		        'label' => 'Categories',
		        'query_var' => true,
		        'show_in_rest' => true,
		        'rewrite' => array( 'slug' => 'categories' )
		    )
		);

		register_post_type( 'route', $args );
	}

	/**
	 * Create a Dashboard Widget for MMD
	 */
	public function mmd_dashboard_widget() {
		wp_add_dashboard_widget(
			'mmd_dashboard_widget',
			__( 'MMD Something', 'mmd' ), array( $this, 'mmd_render_dashboard_widget' )
		);
	}

	/**
	 * Render the Dashboard Widget info
	 */
	public function mmd_render_dashboard_widget() {
		echo '<div id="mmd-dashboard-widget"></div>';
	}
	
	/**
	 * Create admin columns in the post type list
	 */
	// public function mmd_post_list_columns( $columns ) {
	// 	return array(
	// 		'cb'               => '<input type="checkbox" />',
	// 		'title'            => __( 'Title', 'mmd' ),
	// 		'mmd_permalink'  => __( 'Track Link', 'mmd' ),
	// 		'mmd_cats'       => __( 'Category', 'mmd' ),
	// 		'mmd_created_on' => __( 'Date', 'mmd' )
	// 	);
	// }

	/**
	 * Fill admin columns with info
	 */
	public function mmd_post_list_columns_detail( $column ) {
		global $post;
		
		switch ( $column ) {
			case 'mmd_permalink' : ?>
				<div class="mmd-list-track">
					<div class="link-meta-box-input">
						<div class="mmd-copy fa-regular fa-copy"></div>
							<input type="text" value="<?php echo esc_url( get_permalink() ); ?>" class="mmd-input" disabled />
							<span class="mmd-tooltip"><?php esc_html_e( 'Copy to Clipboard', 'mmd' ) ?></span>
						</div>
					</div>
				</div><?php
				break;
			case 'mmd_cats': ?>
				<div class="mmd-list-cats">
					<?php echo get_the_term_list($post->ID, 'mmds', '', ', ', ''); ?>
				</div><?php
				break;
			case 'mmd_created_on':
				$post_date = get_the_date( '', $post->ID );
				echo __( 'Published', 'mmd' ) . ' ' . $post_date;
				break;
		}
	}

	/**
	 * Create MMD post type meta box
	 */
	// public function mmd_post_type_meta_box() {
	// 	add_meta_box(
	// 		'mmd-details',
	// 		__( 'Redirect Link', 'mmd' ),
	// 		array( &$this, 'mmd_render_post_type_meta_box' ),
	// 		'mmd',
	// 		'normal',
	// 		'high'
	// 	);
	// }

	/**
	 * Render the post type meta box
	 */
	public function mmd_render_post_type_meta_box( $post ) {
		wp_nonce_field( basename( __FILE__ ), '_mmd_meta_box_nonce' );
    
		$field_id = '_mmd_redirect';
		$field_exists = get_post_meta( $post->ID, $field_id, true ) ? 'mmd-metabox-on' : '';
		$saved_tags = json_decode(get_post_meta( $post->ID, '_mmd_url_params', true ));

		$field_value = esc_attr( get_post_meta( $post->ID, $field_id, true ) );
		$sanitized_tags = esc_attr( $saved_tags );
		$sanitized_field_exists = sanitize_html_class( $field_exists );

		echo strtr( '<div class="mmd-metabox ' . $sanitized_field_exists . '">
						<h5 class="mmd-title"><label for="{name}">image, description, etc</label></h5>
						<input type="url" id="{name}" name="{name}" value="{value}" placeholder="{placeholder}" class="mmd-input" />
					</div>
					<input type="hidden" id="_mmd_url_params" name="_mmd_url_params" value="' . $sanitized_tags . '" class="mmd-input" />', array(
			'{label}' => __( 'Redirect the link to:', 'mmd' ),
			'{name}'  => esc_attr( $field_id ),
			'{placeholder}' => esc_url( __( 'https://enter-your-link.com/', 'mmd' ) ),
			'{value}' => $field_value,
		) ); ?>
		<div id="mmd-post-metabox"></div><?php
	}

	// public function mmd_save_post_meta($post_id) {
	// 	if ( ! isset( $_POST['_mmd_meta_box_nonce'] ) || ! wp_verify_nonce( $_POST['_mmd_meta_box_nonce'], basename( __FILE__ ) ) )
	// 		return;

	// 	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
	// 		return;

	// 	if ( defined( 'DOING_AJAX' ) && DOING_AJAX )
	// 		return;

	// 	if ( defined( 'DOING_CRON' ) && DOING_CRON )
	// 		return;
		
	// 	if ( isset( $_POST['_mmd_redirect'] ) ) :
	// 		update_post_meta( $post_id, '_mmd_redirect', sanitize_text_field( $_POST['_mmd_redirect'] ) );
	// 		update_post_meta( $post_id, '_mmd_url_params', json_encode($_POST['_mmd_url_params']) );
	// 	else :
	// 		delete_post_meta( $post_id, '_mmd_redirect' );
	// 	endif;
	// }
}
new MapMyDistance_Admin();
