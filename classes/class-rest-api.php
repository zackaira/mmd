<?php
/*
 * Create Custom Rest API Endpoints
 */
class MapMyDistance_Rest_Routes {
	public function __construct() {
		add_action('rest_api_init', [$this, 'mmd_create_rest_routes']);
	}

	/*
	 * Create REST API routes for get & save
	 */
	public function mmd_create_rest_routes() {
		// Plugin Settings
		register_rest_route('mmd-api/v1', '/settings', [
			'methods' => 'GET',
			'callback' => [$this, 'mmd_get_settings'],
			'permission_callback' => [$this, 'mmd_get_settings_permission'],
		]);
		register_rest_route('mmd-api/v1', '/settings', [
			'methods' => 'POST',
			'callback' => [$this, 'mmd_save_settings'],
			'permission_callback' => [$this, 'mmd_save_settings_permission'],
		]);
		register_rest_route('mmd-api/v1', '/delete', [
			'methods' => 'DELETE',
			'callback' => [$this, 'mmd_delete_settings'],
			'permission_callback' => [$this, 'mmd_save_settings_permission'],
		]);
		// Account Profile Picture
		// register_rest_route( 'mmd-api/v1', '/upload-profile-picture/(?P<user_id>\d+)', array(
		// 	'methods' => 'POST',
		// 	'callback' => [$this, 'mmd_upload_profile_picture'],
		// 	'permission_callback' => [$this, 'mmd_save_route_permission'],
		// ));
		// register_rest_route( 'mmd-api/v1', '/get-profile-picture/(?P<user_id>\d+)', array(
		// 	'methods' => 'GET',
		// 	'callback' => [$this, 'mmd_get_profile_picture'],
		// 	'permission_callback' => [$this, 'mmd_save_route_permission'],
		// ));
		// Routes
		register_rest_route('mmd-api/v1', '/save-route', [
			'methods' => 'POST',
			'callback' => [$this, 'mmd_save_route'],
			'permission_callback' => [$this, 'mmd_save_route_permission'],
		]);
		register_rest_route('mmd-api/v1', '/update-route/(?P<id>[a-f0-9]{32})', [
			'methods' => 'PUT',
			'callback' => [$this, 'mmd_update_route'],
			'permission_callback' => [$this, 'mmd_save_route_permission'],
			'args' => [
				'id' => [
					'validate_callback' => function($param, $request, $key) {
						return ctype_xdigit($param) && strlen($param) === 32;
					}
				],
			],
		]);
		register_rest_route('mmd-api/v1', '/get-route/(?P<id>[a-f0-9]{32})', [
			'methods' => 'GET',
			'callback' => [$this, 'mmd_get_route'],
			'permission_callback' => [$this, 'mmd_get_settings_permission'],
			'args' => [
				'id' => [
					'validate_callback' => function($param, $request, $key) {
						return ctype_xdigit($param) && strlen($param) === 32;
					}
				],
			],
		]);
		// New Route: Get All Routes by User ID
		register_rest_route('mmd-api/v1', '/get-user-routes/(?P<user_id>\d+)', [
			'methods' => 'GET',
			'callback' => [$this, 'mmd_get_user_routes'],
			'permission_callback' => [$this, 'mmd_save_route_permission'],
		]);
		// Delete Route from Database
		register_rest_route('mmd-api/v1', '/delete-route/(?P<id>[a-f0-9]{32})', [
			'methods' => 'DELETE',
			'callback' => [$this, 'mmd_delete_route'],
			'permission_callback' => [$this, 'mmd_save_route_permission'],
		]);
	}

	/*
	 * Get saved options from database
	 */
	public function mmd_get_settings() {
		$mmdPluginOptions = get_option('mmd_options');

		if (!$mmdPluginOptions)
			return;

		return rest_ensure_response($mmdPluginOptions);
	}

	/*
	 * Allow permissions for get options
	 */
	public function mmd_get_settings_permission() {
		return true;
	}

	/*
	 * Set save permissions for Admin users
	 */
	public function mmd_save_settings_permission() {
		return current_user_can('publish_posts') ? true : false;
	}

	/*
	 * Set save permissions for Customers & Subscriber users
	 */
	public function mmd_save_route_permission() {
		return is_user_logged_in() && current_user_can('read') ? true : false;
	}

	/*
	 * Save settings as JSON string
	 */
	public function mmd_save_settings() {
		$req = file_get_contents('php://input');
		$reqData = json_decode($req, true);

		update_option('mmd_options', $reqData['mmdOptions']);

		return rest_ensure_response($resp);
	}

	/*
	 * Delete the plugin settings
	 */
	public function mmd_delete_settings() {
		delete_option('mmd_options');

		return rest_ensure_response('Success!');
	}

	// Handle profile picture upload
	public function mmd_upload_profile_picture( $request ) {
		$user_id = intval($request['user_id']);
		$files = $request->get_file_params();

		if ( ! isset( $files['file'] ) ) {
			return new WP_Error( 'no_file', 'No file was uploaded', array( 'status' => 400 ) );
		}

		require_once( ABSPATH . 'wp-admin/includes/image.php' );
		require_once( ABSPATH . 'wp-admin/includes/file.php' );
		require_once( ABSPATH . 'wp-admin/includes/media.php' );

		$attachment_id = media_handle_upload( 'file', 0 );

		if ( is_wp_error( $attachment_id ) ) {
			return new WP_Error( 'upload_error', $attachment_id->get_error_message(), array( 'status' => 500 ) );
		}

		$attachment_url = wp_get_attachment_url( $attachment_id );
		update_user_meta( $user_id, 'user_avatar', $attachment_url );

		return new WP_REST_Response( array( 'url' => $attachment_url ), 200 );
	}

	// Get profile picture URL
	public function mmd_get_profile_picture() {
		$user_id = intval($request['user_id']);
		$avatar_url = get_user_meta( $user_id, 'user_avatar', true );

		if ( ! $avatar_url ) {
			return new WP_Error( 'no_picture', 'No profile picture set', array( 'status' => 404 ) );
		}

		return new WP_REST_Response( array( 'url' => $avatar_url ), 200 );
	}

	/*
	 * SAVE User Route
	 */
	public function mmd_save_route($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		$params = $request->get_params();
	
		$user_id = get_current_user_id();
		$route_name = sanitize_text_field($params['routeName']);
		$route_description = sanitize_textarea_field($params['description']);
		$route_tags = sanitize_text_field(implode(',', $params['tags']));
		$route_activity = sanitize_text_field($params['activity']);
		$route_data = json_encode($params['routeData']);
		$distance = floatval($params['distance']);
	
		// Generate a unique hash ID
		$hash_id = $this->generate_unique_hash_id($user_id, $route_name);
	
		$result = $wpdb->insert(
			$table_name,
			[
				'id' => $hash_id,
				'user_id' => $user_id,
				'route_name' => $route_name,
				'route_description' => $route_description,
				'route_tags' => $route_tags,
				'route_activity' => $route_activity,
				'route_data' => $route_data,
				'created_at' => current_time('mysql'),
				'distance' => $distance,
			],
			[
				'%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%f'
			]
		);
	
		if ($result === false) {
			return new WP_Error('route_save_failed', 'Failed to save the route', ['status' => 500]);
		}
	
		return rest_ensure_response([
			'success' => true,
			'message' => 'Route saved successfully',
			'route_id' => $hash_id
		]);
	}

	/*
	 * UPDATE User Route
	 */
	public function mmd_update_route($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
		$route_id = $request['id'];
		$current_user_id = get_current_user_id();
	
		// Get the route data
		$route = $wpdb->get_row(
			$wpdb->prepare("SELECT * FROM $table_name WHERE id = %s", $route_id),
			ARRAY_A
		);
	
		if (!$route) {
			return new WP_Error('no_route', 'Route not found', array('status' => 404));
		}
	
		// Check if the current user is the owner of the route
		if ($route['user_id'] != $current_user_id) {
			return new WP_Error('unauthorized', 'You do not have permission to edit this route', array('status' => 403));
		}
	
		$params = $request->get_json_params();
	
		// Verify that the user ID in the request matches the current user
		if (!isset($params['user_id']) || $params['user_id'] != $current_user_id) {
			return new WP_Error('invalid_user', 'Invalid user ID', array('status' => 400));
		}
	
		// Update the route data
		$updated_data = array(
			'route_name' => sanitize_text_field($params['route_name']),
			'route_description' => sanitize_textarea_field($params['route_description']),
			'route_tags' => sanitize_text_field($params['route_tags']),
			'route_activity' => sanitize_text_field($params['route_activity']),
		);
	
		// Update route_data including allowRouteEditing
		$route_data = json_decode($route['route_data'], true) ?: array();
		$route_data['allowRouteEditing'] = isset($params['allowRouteEditing']) ? (bool)$params['allowRouteEditing'] : false;
		$updated_data['route_data'] = json_encode($route_data);
	
		$result = $wpdb->update(
			$table_name,
			$updated_data,
			array('id' => $route_id)
		);
	
		if ($result === false) {
			return new WP_Error('db_update_error', 'Failed to update the route in the database.', array('status' => 500));
		}
	
		// Get the updated route
		$updated_route = $wpdb->get_row(
			$wpdb->prepare("SELECT * FROM $table_name WHERE id = %s", $route_id),
			ARRAY_A
		);
	
		// Decode route_data for the response
		$updated_route['route_data'] = json_decode($updated_route['route_data'], true);
	
		return new WP_REST_Response(array(
			'success' => true,
			'message' => 'Route updated successfully',
			'route' => $updated_route
		), 200);
	}
	
	/*
	 * Generate a unique hash ID for the route
	 */
	private function generate_unique_hash_id($user_id, $route_name) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		do {
			$hash_id = md5(uniqid($user_id . $route_name, true));
			$exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $table_name WHERE id = %s",
				$hash_id
			));
		} while ($exists > 0);
	
		return $hash_id;
	}

	/*
	 * GET User Route
	 */
	public function mmd_get_route($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		$route_id = $request['id'];
		
		error_log("Fetching route with ID: " . $route_id);
	
		$route = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM $table_name WHERE id = %s",
				$route_id
			),
			ARRAY_A
		);
	
		if (!$route) {
			error_log("No route found with ID: " . $route_id);
			return new WP_Error('no_route', 'No route found with this ID', ['status' => 404]);
		}
	
		error_log("Route found: " . print_r($route, true));
	
		// Decode the JSON stored in route_data
		$route['route_data'] = json_decode($route['route_data'], true);
	
		// Prepare the response in a consistent format
		$response = [
			'success' => true,
			'route' => [
				'id' => $route['id'],
				'routeName' => $route['route_name'],
				'description' => $route['route_description'],
				'tags' => explode(',', $route['route_tags']),
				'activity' => $route['route_activity'],
				'fullDistance' => floatval($route['distance']),
				'coordinates' => $route['route_data']['coordinates'] ?? [],
				'linestring' => $route['route_data']['linestring'] ?? [],
				'units' => $route['route_data']['units'] ?? 'km',
				'bounds' => $route['route_data']['bounds'] ?? null,
				'allowRouteEditing' => isset($route['route_data']['allowRouteEditing']) ? (bool)$route['route_data']['allowRouteEditing'] : false,
			],
		];

		// Check if the current user has permission to view this route
		// Can make the route private or public with a check like this
		// if (get_current_user_id() != $route['user_id']) {
		// 	return new WP_Error('no_permission', 'You do not have permission to view this route', ['status' => 403]);
		// }
	
		return rest_ensure_response($response);
	}

	/*
	 * GET All User Routes
	 */
	public function mmd_get_user_routes($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		$user_id = intval($request['user_id']);
		$page = isset($request['page']) ? intval($request['page']) : 1;
		$per_page = isset($request['per_page']) ? intval($request['per_page']) : 10;
		$offset = ($page - 1) * $per_page;
	
		// Get total count of routes for this user
		$total_routes = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM $table_name WHERE user_id = %d",
			$user_id
		));
	
		// Get paginated routes
		$routes = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM $table_name WHERE user_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
				$user_id,
				$per_page,
				$offset
			),
			ARRAY_A
		);
	
		if (!$routes) {
			return new WP_Error('no_routes', 'No routes found for this user', ['status' => 404]);
		}
	
		// Decode the JSON stored in route_data for each route
		foreach ($routes as &$route) {
			$route['route_data'] = json_decode($route['route_data'], true);
		}
	
		return rest_ensure_response([
			'success' => true,
			'routes' => $routes,
			'total' => intval($total_routes),
			'page' => $page,
			'per_page' => $per_page,
		]);
	}

	/*
	 * Delete a Route from the Database by RouteId
	 */
	function mmd_delete_route($request) {
		global $wpdb;
		$route_id = $request['id'];
		$table_name = $wpdb->prefix . 'mmd_map_routes';
	
		$result = $wpdb->delete($table_name, ['id' => $route_id], ['%s']);
	
		if ($result === false) {
			return new WP_Error('route_delete_failed', 'Failed to delete the route', ['status' => 500]);
		}
	
		return rest_ensure_response(['success' => true, 'message' => 'Route deleted successfully']);
	}
}
new MapMyDistance_Rest_Routes();
