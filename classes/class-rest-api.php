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
		// Signup Username Check
		register_rest_route('mmd-api/v1', '/check-username/(?P<username>[a-zA-Z0-9\.\-]+)', array(
			'methods' => 'GET',
			'callback' => [$this, 'mmd_check_username_availability'],
			'permission_callback' => [$this, 'mmd_get_settings_permission'],
			'args' => array(
				'username' => array(
					'validate_callback' => function($param, $request, $key) {
						return preg_match('/^[a-zA-Z0-9\.\-]+$/', $param);
					}
				),
			),
		));
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
		/*
		 * Admin Stats API
		 */
		register_rest_route('mmd-api/v1', '/stats', [
			'methods' => 'GET',
			'callback' => [$this, 'mmd_get_user_stats'],
			'permission_callback' => [$this, 'mmd_admin_permissions_check'],
		]);
	}

	/*
	 * Check Username Availability
	 */
	public function mmd_check_username_availability( $request ) {
		global $wpdb;
		$username = $request->get_param( 'username' );
		
		if ( empty( $username ) ) {
			return new WP_Error( 'empty_username', 'Username cannot be empty', array( 'status' => 400 ) );
		}

		if (!preg_match('/^[a-zA-Z0-9\.\-]+$/', $username)) {
			return new WP_Error('invalid_username', 'Username can only contain letters, numbers, dots, and hyphens.', array('status' => 400));
		}

		// Sanitize the username
		$username = sanitize_user( $username );

		// Perform a direct SQL query
		$query = $wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->users} WHERE user_login = %s",
			$username
		);
		
		$user_count = $wpdb->get_var( $query );
		
		return array(
			'available' => $user_count == 0
		);
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

	public function mmd_admin_permissions_check() {
        return current_user_can('manage_options');
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
		try {
			global $wpdb;
			$table_name = $wpdb->prefix . 'mmd_map_routes';
			$association_table = $wpdb->prefix . 'mmd_user_route_associations';
		
			$params = $request->get_params();
		
			$user_id = get_current_user_id();
			$route_name = sanitize_text_field($params['routeName']);
			$route_description = wp_kses_post($params['routeDescription']);
			$route_tags = isset($params['routeTags']) ? (is_array($params['routeTags']) ? implode(',', array_map('sanitize_text_field', $params['routeTags'])) : sanitize_text_field($params['routeTags'])) : '';
			$route_activity = sanitize_text_field($params['routeActivity']);
			$distance = isset($params['routeDistance']) ? floatval($params['routeDistance']) : 0;
		
			// Prepare route data
			$route_data = [
				'coordinates' => $params['routeData']['coordinates'] ?? [],
				'linestring' => $params['routeData']['linestring'] ?? [],
				'bounds' => $params['routeData']['bounds'] ?? null,
				'allowRouteEditing' => isset($params['routeData']['allowRouteEditing']) ? (bool) $params['routeData']['allowRouteEditing'] : false,
				'pointsOfInterest' => isset($params['routeData']['pointsOfInterest']) ? $this->mmd_sanitize_points_of_interest($params['routeData']['pointsOfInterest']) : [],
				'units' => $params['routeData']['units'] ?? 'km',
			];
		
			$route_data_json = json_encode($route_data);
		
			// Generate a unique hash ID
			$hash_id = $this->generate_unique_hash_id($user_id, $route_name);
		
			$result = $wpdb->insert(
				$table_name,
				[
					'id' => $hash_id,
					'route_name' => $route_name,
					'route_description' => $route_description,
					'route_tags' => $route_tags,
					'route_activity' => $route_activity,
					'route_data' => $route_data_json,
					'created_at' => current_time('mysql'),
					'route_distance' => $distance,
				],
				['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f']
			);
		
			if ($result === false) {
				return new WP_Error('route_save_failed', 'Failed to save the route', ['status' => 500]);
			}
		
			// Add entry to user_route_associations table
			$association_result = $wpdb->insert(
				$association_table,
				[
					'user_id' => $user_id,
					'route_id' => $hash_id,
					'association_type' => 'owner'
				],
				['%d', '%s', '%s']
			);
	
			if ($association_result === false) {
				return new WP_Error('association_save_failed', 'Failed to save the route association', ['status' => 500]);
			}
		
			// Prepare the response data
			$response_data = [
				'success' => true,
				'message' => 'Route saved successfully',
				'route' => [
					'routeId' => $hash_id,
					'routeName' => $route_name,
					'routeDescription' => $route_description,
					'routeTags' => explode(',', $route_tags),
					'routeActivity' => $route_activity,
					'routeDistance' => $distance,
					'isRouteOwner' => true,
					'routeData' => $route_data,
				]
			];
		
			return new WP_REST_Response($response_data, 200);
		} catch (Exception $e) {
			return new WP_Error('save_route_error', $e->getMessage(), ['status' => 500]);
		}
	}

	// Function to Sanitize the Points of Interest
	private function mmd_sanitize_points_of_interest($points) {
		return array_map(function($point) {
			return [
				'id' => isset($point['id']) ? intval($point['id']) : null,
				'title' => isset($point['title']) ? sanitize_text_field($point['title']) : '',
				'description' => isset($point['description']) ? sanitize_textarea_field($point['description']) : '',
				'lngLat' => isset($point['lngLat']) && is_array($point['lngLat']) ? 
					array_map('floatval', $point['lngLat']) : 
					[0, 0],
				'icon' => isset($point['icon']) ? sanitize_text_field($point['icon']) : 'fa-map-marker'
			];
		}, $points);
	}

	/*
	 * UPDATE User Route
	 */
	public function mmd_update_route($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
		$association_table = $wpdb->prefix . 'mmd_user_route_associations';
		$route_id = $request['id'];
		$current_user_id = get_current_user_id();
		
		$params = $request->get_json_params();
		$save_as_new = isset($params['save_as_new']) ? (bool)$params['save_as_new'] : false;
	
		// Check user's association with the route
		$user_association = $wpdb->get_row($wpdb->prepare(
			"SELECT association_type FROM $association_table WHERE user_id = %d AND route_id = %s",
			$current_user_id,
			$route_id
		));
	
		// If user is not associated, add them as a collaborator (but do not create a new route)
		if (!$user_association && !$save_as_new) {
			$wpdb->insert(
				$association_table,
				array(
					'user_id' => $current_user_id,
					'route_id' => $route_id,
					'association_type' => 'collaborator'
				),
				array('%d', '%s', '%s')
			);
		}
	
		// If saving as new, generate a new unique ID for the route
		if ($save_as_new) {
			$new_route_id = $this->generate_unique_hash_id($current_user_id, $params['routeName']);
			$updated_data = [
				'id' => $new_route_id,
				'route_name' => sanitize_text_field($params['routeName']),
				'route_description' => wp_kses_post($params['routeDescription']),
				'route_tags' => is_array($params['routeTags']) 
					? implode(',', array_map('sanitize_text_field', $params['routeTags'])) 
					: sanitize_text_field($params['routeTags']),
				'route_activity' => sanitize_text_field($params['routeActivity']),
				'route_distance' => isset($params['routeDistance']) ? floatval($params['routeDistance']) : 0,
				'route_data' => json_encode([
					'coordinates' => $params['routeData']['coordinates'] ?? [],
					'linestring' => $params['routeData']['linestring'] ?? [],
					'bounds' => $params['routeData']['bounds'] ?? null,
					'allowRouteEditing' => isset($params['routeData']['allowRouteEditing']) ? (bool)$params['routeData']['allowRouteEditing'] : false,
					'pointsOfInterest' => isset($params['routeData']['pointsOfInterest']) ? $this->mmd_sanitize_points_of_interest($params['routeData']['pointsOfInterest']) : [],
					'units' => $params['routeData']['units'] ?? 'km',
				]),
				'created_at' => current_time('mysql'),
			];
	
			// Insert the new route
			$wpdb->insert($table_name, $updated_data);
	
			// Add the current user as the owner of the new route
			$wpdb->insert(
				$association_table,
				array(
					'user_id' => $current_user_id,
					'route_id' => $new_route_id,
					'association_type' => 'owner'
				),
				array('%d', '%s', '%s')
			);
	
			$route_id = $new_route_id; // Use new route ID for response
		} else {
			// Otherwise, update the existing route
			$updated_data = [
				'route_name' => sanitize_text_field($params['routeName']),
				'route_description' => wp_kses_post($params['routeDescription']),
				'route_tags' => is_array($params['routeTags']) 
					? implode(',', array_map('sanitize_text_field', $params['routeTags'])) 
					: sanitize_text_field($params['routeTags']),
				'route_activity' => sanitize_text_field($params['routeActivity']),
				'route_distance' => isset($params['routeDistance']) ? floatval($params['routeDistance']) : 0,
				'route_data' => json_encode([
					'coordinates' => $params['routeData']['coordinates'] ?? [],
					'linestring' => $params['routeData']['linestring'] ?? [],
					'bounds' => $params['routeData']['bounds'] ?? null,
					'allowRouteEditing' => isset($params['routeData']['allowRouteEditing']) ? (bool)$params['routeData']['allowRouteEditing'] : false,
					'pointsOfInterest' => isset($params['routeData']['pointsOfInterest']) ? $this->mmd_sanitize_points_of_interest($params['routeData']['pointsOfInterest']) : [],
					'units' => $params['routeData']['units'] ?? 'km',
				]),
			];
	
			$wpdb->update($table_name, $updated_data, array('id' => $route_id));
		}
	
		// Prepare the response data
		$response = [
			'success' => true,
			'message' => $save_as_new ? 'New route created successfully' : 'Route updated successfully',
			'route' => [
				'routeId' => $route_id,
				'routeName' => $updated_data['route_name'],
				'routeDescription' => $updated_data['route_description'],
				'routeTags' => explode(',', $updated_data['route_tags']),
				'routeActivity' => $updated_data['route_activity'],
				'routeDistance' => $updated_data['route_distance'],
				'isRouteOwner' => ($user_association && $user_association->association_type === 'owner'),
				'routeData' => json_decode($updated_data['route_data'], true),
			]
		];
	
		return new WP_REST_Response($response, 200);
	}
	
	
	/*
	 * Generate a unique hash ID for the route
	 */
	private function generate_unique_hash_id($user_id, $route_name) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
		$association_table = $wpdb->prefix . 'mmd_user_route_associations';
	
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
		$association_table = $wpdb->prefix . 'mmd_user_route_associations';
	
		$route_id = $request['id'];
		$current_user_id = get_current_user_id();
	
		$route = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT r.*, a.user_id as original_creator, a.association_type
				FROM $table_name r
				JOIN $association_table a ON r.id = a.route_id
				WHERE r.id = %s",
				$route_id
			),
			ARRAY_A
		);
	
		if (!$route) {
			return new WP_Error('no_route', 'No route found with this ID', ['status' => 404]);
		}
	
		// Decode the JSON stored in route_data
		$route_data = json_decode($route['route_data'], true);
	
		if (json_last_error() !== JSON_ERROR_NONE) {
			error_log('JSON decode error in mmd_get_route: ' . json_last_error_msg());
			return new WP_Error('json_decode_error', 'Failed to decode route data', ['status' => 500]);
		}

		// Check if the current user is the route owner
		$is_route_owner = ($current_user_id && $current_user_id == $route['original_creator'] && $route['association_type'] == 'owner');
	
		// Prepare the response in a consistent format
		$response = [
			'success' => true,
			'route' => [
				'routeId' => $route['id'],
				'routeName' => $route['route_name'],
				'routeDescription' => $route['route_description'],
				'routeTags' => explode(',', $route['route_tags']),
				'routeActivity' => $route['route_activity'],
				'routeDistance' => floatval($route['route_distance']),
				'isRouteOwner' => $is_route_owner,
				'routeData' => $route_data
			],
		];
	
		return rest_ensure_response($response);
	}
	// Check if the current user has permission to view this route
	// Can make the route private or public with a check like this
	// if (get_current_user_id() != $route['user_id']) {
	// 	return new WP_Error('no_permission', 'You do not have permission to view this route', ['status' => 403]);
	// }

	/*
	 * GET All User Routes
	 */
	public function mmd_get_user_routes($request) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'mmd_map_routes';
		$association_table = $wpdb->prefix . 'mmd_user_route_associations';
	
		$user_id = intval($request['user_id']);
		$page = isset($request['page']) ? intval($request['page']) : 1;
		$per_page = isset($request['per_page']) ? intval($request['per_page']) : 10;
		$offset = ($page - 1) * $per_page;
	
		// Get total count of routes for this user (both owner and collaborator)
		$total_routes = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM $association_table WHERE user_id = %d",
			$user_id
		));
	
		// Get paginated routes for the user, including both owned and collaborated routes
		$routes = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT r.*, a.association_type 
				FROM $table_name r
				JOIN $association_table a ON r.id = a.route_id
				WHERE a.user_id = %d 
				ORDER BY r.created_at DESC 
				LIMIT %d OFFSET %d",
				$user_id,
				$per_page,
				$offset
			),
			ARRAY_A
		);
	
		if (!$routes) {
			// Return a message if no routes are found
			return rest_ensure_response([
				'success' => false,
				'message' => 'No routes found for this user',
				'routes' => [],
				'total' => 0,
				'page' => $page,
				'per_page' => $per_page,
			]);
		}
	
		// Decode the JSON stored in route_data for each route and add isRouteOwner flag
		foreach ($routes as &$route) {
			// Count collaborators for this route (excluding the owner)
			$collaborator_count = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $association_table 
				WHERE route_id = %d AND association_type = 'collaborator'",
				$route['id']
			));

			$route = [
				'routeId' => $route['id'],
				'routeName' => $route['route_name'],
				'routeDescription' => $route['route_description'],
				'routeTags' => explode(',', $route['route_tags']),
				'routeActivity' => $route['route_activity'],
				'routeDistance' => floatval($route['route_distance']),
				'isRouteOwner' => ($route['association_type'] === 'owner'),
				'routeData' => json_decode($route['route_data'], true),
				'collaborators' => intval($collaborator_count),
				'created_at' => $route['created_at'],
			];
		}
	
		// Return the routes in a paginated response
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
		$current_user_id = get_current_user_id();
		$table_name = $wpdb->prefix . 'mmd_map_routes';
		$association_table = $wpdb->prefix . 'mmd_user_route_associations';
	
		// Check the user's association with the route
		$user_association = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM $association_table WHERE user_id = %d AND route_id = %s",
			$current_user_id,
			$route_id
		));
	
		if (!$user_association) {
			return new WP_Error('not_associated', 'You are not associated with this route', ['status' => 403]);
		}
	
		// Count the number of users associated with this route
		$associated_users_count = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM $association_table WHERE route_id = %s",
			$route_id
		));
	
		// If this is the only user associated with the route, delete the route and its association
		if ($associated_users_count == 1) {
			$wpdb->delete($table_name, ['route_id' => $route_id], ['%s']);
			$wpdb->delete($association_table, ['route_id' => $route_id], ['%s']);
	
			return rest_ensure_response([
				'success' => true, 
				'message' => 'Route deleted successfully as you were the last associated user'
			]);
		} 
		// If the user is the owner and there are other collaborators
		elseif ($user_association->association_type === 'owner') {
			// Update all collaborators to owners
			$wpdb->update(
				$association_table,
				['association_type' => 'owner'],
				['route_id' => $route_id, 'association_type' => 'collaborator'],
				['%s'],
				['%s', '%s']
			);
	
			// Remove the current owner's association
			$wpdb->delete($association_table, [
				'user_id' => $current_user_id,
				'route_id' => $route_id
			], ['%d', '%s']);
	
			// Update the route to allow editing by default
			$route_data = $wpdb->get_var($wpdb->prepare(
				"SELECT route_data FROM $table_name WHERE id = %s",
				$route_id
			));
			$route_data_array = json_decode($route_data, true);
			$route_data_array['allowRouteEditing'] = true;
			$wpdb->update(
				$table_name,
				['route_data' => json_encode($route_data_array)],
				['route_id' => $route_id],
				['%s'],
				['%s']
			);
	
			return rest_ensure_response([
				'success' => true, 
				'message' => 'You have been dissociated from the route. All collaborators have been promoted to owners.'
			]);
		}
		// If the user is a collaborator, just remove their association
		else {
			$wpdb->delete($association_table, [
				'user_id' => $current_user_id,
				'route_id' => $route_id
			], ['%d', '%s']);
	
			return rest_ensure_response([
				'success' => true, 
				'message' => 'You have been successfully dissociated from the route'
			]);
		}
	}

	/*
	 * Get User Stats for Admin
	 */

	/*
	 * Get Users & their routes count
	 */
	public function mmd_get_user_stats() {
		global $wpdb;
	
		$roles = ['customer', 'administrator'];
	
		$role_placeholders = implode(',', array_fill(0, count($roles), '%s'));
		
		$query = $wpdb->prepare(
			"SELECT 
				u.ID as user_id, 
				u.user_email as email, 
				u.display_name as name, 
				COUNT(DISTINCT a.route_id) as route_count,
				GROUP_CONCAT(um.meta_value) as roles
			FROM {$wpdb->users} u
			LEFT JOIN {$wpdb->prefix}mmd_user_route_associations a ON u.ID = a.user_id
			INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id AND um.meta_key = '{$wpdb->prefix}capabilities'
			WHERE (um.meta_value LIKE %s OR um.meta_value LIKE %s)
			GROUP BY u.ID
			ORDER BY u.ID",
			array_merge(
				array_map(function($role) use ($wpdb) { 
					return '%' . $wpdb->esc_like('"' . $role . '"') . '%'; 
				}, $roles)
			)
		);
	
		$results = $wpdb->get_results($query);
	
		$stats = array_map(function($row) {
			$roles = maybe_unserialize($row->roles);
			return [
				'user_id' => (int)$row->user_id,
				'email' => $row->email,
				'name' => $row->name,
				'roles' => is_array($roles) ? array_keys($roles) : [],
				'route_count' => (int)$row->route_count
			];
		}, $results);
	
		return new WP_REST_Response($stats, 200);
	}
}
new MapMyDistance_Rest_Routes();
