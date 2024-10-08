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
		 * Public Routes API
		 */
		// Apply for public route
		register_rest_route('mmd-api/v1', '/apply-for-public-route', [
			'methods' => 'POST',
			'callback' => [$this, 'mmd_apply_for_public_route'],
			'permission_callback' => [$this, 'mmd_save_route_permission'],
			'args' => [
				'route_id' => [
					'required' => true,
					'validate_callback' => function($param) {
						return is_string($param);
					}
				],
				'event_type' => [
					'required' => true,
					'validate_callback' => function($param) {
						return is_string($param);
					}
				],
				'about_event' => [
					'required' => true,
					'validate_callback' => function($param) {
						return is_string($param);
					}
				],
				'links' => [
					'required' => false,
					'validate_callback' => function($param) {
						return is_string($param);
					}
				]
			]
		]);
		// Admin Get public route applications
		register_rest_route('mmd-api/v1', '/public-route-applications', [
			'methods' => 'GET',
			'callback' => [$this, 'mmd_get_public_route_applications'],
			'permission_callback' => [$this, 'mmd_admin_permissions_check'],
			'args' => [
				'status' => [
					'required' => false,
					'default' => 'pending',
					'validate_callback' => function($param) {
						return in_array($param, ['pending', 'approved', 'denied', 'all']);
					}
				]
			]
		]);
		// Approve or Deny public route applications
		register_rest_route('mmd-api/v1', '/admin-approve-public-route/(?P<id>\d+)', [
			'methods' => 'POST',
			'callback' => [$this, 'mmd_admin_approve_public_route'],
			'permission_callback' => function() {
				return current_user_can('manage_options');
			},
			'args' => [
				'id' => [
					'validate_callback' => function($param, $request, $key) {
						return is_numeric($param);
					}
				],
				'status' => [
					'required' => true,
					'validate_callback' => function($param, $request, $key) {
						return in_array($param, ['approved', 'denied']);
					}
				],
				'admin_notes' => [
					'required' => false,
					'sanitize_callback' => 'sanitize_textarea_field'
				]
			]
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
			$wants_public = isset($params['wantsPublic']) ? (bool)$params['wantsPublic'] : false;
			$event_type = isset($params['eventType']) ? sanitize_text_field($params['eventType']) : '';
			$about_event = isset($params['aboutEvent']) ? sanitize_textarea_field($params['aboutEvent']) : '';
			$links = isset($params['links']) ? sanitize_textarea_field($params['links']) : '';
		
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
					'is_public' => false,  // Always set to false initially
                	'event_type' => '',  // Always set to empty string initially
				],
				['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%d', '%s']
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
		
			// If the user wants the route to be public, create a public route application
			if ($wants_public) {
				$this->create_public_route_application($hash_id, $user_id, $event_type, $about_event, $links);
			}
		
			// Prepare the response data
			$response_data = [
				'success' => true,
				'message' => 'Route saved successfully' . ($wants_public ? '. Public status pending approval.' : ''),
				'route' => [
					'routeId' => $hash_id,
					'routeName' => $route_name,
					'routeDescription' => $route_description,
					'routeTags' => explode(',', $route_tags),
					'routeActivity' => $route_activity,
					'routeDistance' => $distance,
					'isRouteOwner' => true,
					// 'isPublic' => false,
					// 'wantsPublic' => $wants_public,
                	// 'eventType' => '',
					'routeData' => $route_data,
				]
			];
		
			return new WP_REST_Response($response_data, 200);
		} catch (Exception $e) {
			return new WP_Error('save_route_error', $e->getMessage(), ['status' => 500]);
		}
	}

	private function create_public_route_application($route_id, $user_id, $event_type, $about_event = '', $links = '') {
		global $wpdb;
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
	
		$application_data = [
			'route_id' => $route_id,
			'user_id' => $user_id,
			'event_type' => $event_type,
			'about_event' => $about_event,
			'links' => $links,
			'status' => 'pending',
			'applied_at' => current_time('mysql')
		];
	
		$inserted = $wpdb->insert(
			$applications_table,
			$application_data,
			['%s', '%d', '%s', '%s', '%s', '%s', '%s']
		);
	
		if ($inserted === false) {
			error_log("Failed to create public route application. Error: " . $wpdb->last_error);
			return false;
		}
	
		return true;
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
	
		// Prepare route data
		$route_data = [
			'coordinates' => $params['routeData']['coordinates'] ?? [],
			'linestring' => $params['routeData']['linestring'] ?? [],
			'bounds' => $params['routeData']['bounds'] ?? null,
			'allowRouteEditing' => isset($params['routeData']['allowRouteEditing']) ? (bool)$params['routeData']['allowRouteEditing'] : false,
			'pointsOfInterest' => isset($params['routeData']['pointsOfInterest']) ? $this->mmd_sanitize_points_of_interest($params['routeData']['pointsOfInterest']) : [],
			'units' => $params['routeData']['units'] ?? 'km',
		];
	
		$updated_data = [
			'route_name' => sanitize_text_field($params['routeName']),
			'route_description' => wp_kses_post($params['routeDescription']),
			'route_tags' => is_array($params['routeTags']) 
				? implode(',', array_map('sanitize_text_field', $params['routeTags'])) 
				: sanitize_text_field($params['routeTags']),
			'route_activity' => sanitize_text_field($params['routeActivity']),
			'route_distance' => isset($params['routeDistance']) ? floatval($params['routeDistance']) : 0,
			'route_data' => json_encode($route_data),
		];
	
		$wants_public = isset($params['wantsPublic']) ? (bool)$params['wantsPublic'] : false;
		$event_type = isset($params['eventType']) ? sanitize_text_field($params['eventType']) : '';
		$about_event = isset($params['aboutEvent']) ? sanitize_textarea_field($params['aboutEvent']) : '';
		$links = isset($params['links']) ? sanitize_textarea_field($params['links']) : '';

	
		// If saving as new, generate a new unique ID for the route
		if ($save_as_new) {
			$new_route_id = $this->generate_unique_hash_id($current_user_id, $params['routeName']);
			$updated_data['id'] = $new_route_id;
			$updated_data['created_at'] = current_time('mysql');
			$updated_data['is_public'] = false;
        	$updated_data['event_type'] = '';
	
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
			$wpdb->update($table_name, $updated_data, array('id' => $route_id));
		}
	
		// If the user wants the route to be public, create or update a public route application
		if ($wants_public) {
			$this->create_or_update_public_route_application($route_id, $current_user_id, $event_type, $about_event, $links);
		}
	
		// Prepare the response data
		$response = [
			'success' => true,
			'message' => $save_as_new ? 'New route created successfully' : 'Route updated successfully' . ($wants_public ? '. Public status pending approval.' : ''),
			'route' => [
				'routeId' => $route_id,
				'routeName' => $updated_data['route_name'],
				'routeDescription' => $updated_data['route_description'],
				'routeTags' => explode(',', $updated_data['route_tags']),
				'routeActivity' => $updated_data['route_activity'],
				'routeDistance' => $updated_data['route_distance'],
				'isRouteOwner' => ($user_association && $user_association->association_type === 'owner'),
				// 'isPublic' => false,
				// 'wantsPublic' => $wants_public,
				// 'eventType' => '',
				'routeData' => $route_data,
			]
		];
	
		return new WP_REST_Response($response, 200);
	}
	
	private function create_or_update_public_route_application($route_id, $user_id, $event_type, $about_event = '', $links = '') {
		global $wpdb;
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
	
		// Check if an application already exists
		$existing_application = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM $applications_table WHERE route_id = %s AND user_id = %d",
			$route_id,
			$user_id
		));
	
		$application_data = [
			'event_type' => $event_type,
			'about_event' => $about_event,
			'links' => $links,
			'status' => 'pending',
			'applied_at' => current_time('mysql'),
			'processed_at' => null,
			'admin_notes' => null,
		];
	
		if ($existing_application) {
			// Update existing application
			$wpdb->update(
				$applications_table,
				$application_data,
				['id' => $existing_application->id],
				['%s', '%s', '%s', '%s', '%s', '%s', '%s'],
				['%d']
			);
		} else {
			// Create new application
			$wpdb->insert(
				$applications_table,
				array_merge(
					[
						'route_id' => $route_id,
						'user_id' => $user_id,
					],
					$application_data
				),
				['%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
			);
		}
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
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
	
		// Start transaction
		$wpdb->query('START TRANSACTION');
	
		try {
			// Check if the route exists
			$route_exists = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $table_name WHERE id = %s",
				$route_id
			));
	
			if (!$route_exists) {
				throw new Exception('Route does not exist');
			}
	
			// Check the user's association with the route
			$user_association = $wpdb->get_row($wpdb->prepare(
				"SELECT * FROM $association_table WHERE user_id = %d AND route_id = %s",
				$current_user_id,
				$route_id
			));
	
			if (!$user_association) {
				throw new Exception('You are not associated with this route');
			}
	
			// Count the number of users associated with this route
			$associated_users_count = $wpdb->get_var($wpdb->prepare(
				"SELECT COUNT(*) FROM $association_table WHERE route_id = %s",
				$route_id
			));
	
			// If this is the only user associated with the route, delete the route and its associations
			if ($associated_users_count == 1) {
				// Delete from applications table first
				$deleted_applications = $wpdb->delete($applications_table, ['route_id' => $route_id], ['%s']);
				if ($deleted_applications === false) {
					error_log("Failed to delete route applications. Error: " . $wpdb->last_error);
					throw new Exception('Failed to delete route applications');
				}
	
				// Delete from associations table
				$deleted_association = $wpdb->delete($association_table, ['route_id' => $route_id], ['%s']);
				if ($deleted_association === false) {
					error_log("Failed to delete route association. Error: " . $wpdb->last_error);
					throw new Exception('Failed to delete route association');
				}
	
				// Finally, delete the route itself
				$deleted_route = $wpdb->delete($table_name, ['id' => $route_id], ['%s']);
				if ($deleted_route === false) {
					$wpdb_last_error = $wpdb->last_error;
					error_log("Failed to delete route from map_routes table. Error: " . $wpdb_last_error);
					throw new Exception('Failed to delete route from map_routes table. Error: ' . $wpdb_last_error);
				}
	
				$wpdb->query('COMMIT');
				return rest_ensure_response([
					'success' => true, 
					'message' => 'Route deleted successfully as you were the last associated user'
				]);
			} 
			// If the user is the owner and there are other collaborators
			elseif ($user_association->association_type === 'owner') {
				// Update all collaborators to owners
				$updated = $wpdb->update(
					$association_table,
					['association_type' => 'owner'],
					['route_id' => $route_id, 'association_type' => 'collaborator'],
					['%s'],
					['%s', '%s']
				);
	
				if ($updated === false) {
					throw new Exception('Failed to update collaborators');
				}
	
				// Remove the current owner's association
				$deleted = $wpdb->delete($association_table, [
					'user_id' => $current_user_id,
					'route_id' => $route_id
				], ['%d', '%s']);
	
				if ($deleted === false) {
					throw new Exception('Failed to remove owner association');
				}
	
				$wpdb->query('COMMIT');
				return rest_ensure_response([
					'success' => true, 
					'message' => 'You have been dissociated from the route. All collaborators have been promoted to owners.'
				]);
			}
			// If the user is a collaborator, just remove their association
			else {
				$deleted = $wpdb->delete($association_table, [
					'user_id' => $current_user_id,
					'route_id' => $route_id
				], ['%d', '%s']);
	
				if ($deleted === false) {
					throw new Exception('Failed to remove collaborator association');
				}
	
				$wpdb->query('COMMIT');
				return rest_ensure_response([
					'success' => true, 
					'message' => 'You have been successfully dissociated from the route'
				]);
			}
		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');
			error_log("Delete route error: " . $e->getMessage());
			return new WP_Error('delete_failed', $e->getMessage(), ['status' => 400]);
		}
	}

	/*
	 * Admin Functions
	 */
	public function mmd_apply_for_public_route($request) {
		error_log('mmd_apply_for_public_route function called');
		error_log('Request parameters: ' . print_r($request->get_params(), true));
	
		global $wpdb;
	
		// Verify nonce
		if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
			return new WP_Error('invalid_nonce', 'Invalid nonce', array('status' => 403));
		}
	
		$route_id = sanitize_text_field($request['route_id']);
		$user_id = get_current_user_id();
		$event_type = sanitize_text_field($request['event_type']);
		$about_event = sanitize_textarea_field($request['about_event']);
		$links = sanitize_textarea_field($request['links']);
		
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
	
		// Check if the user owns the route
		$is_owner = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->prefix}mmd_user_route_associations 
			WHERE user_id = %d AND route_id = %s AND association_type = 'owner'",
			$user_id, $route_id
		));
	
		if (!$is_owner) {
			error_log("User $user_id is not the owner of route $route_id");
			return new WP_Error('not_owner', "User $user_id is not the owner of route $route_id", array('status' => 403));
		}
	
		// Check if an application already exists
		$existing_application = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM $applications_table WHERE route_id = %s",
			$route_id
		));
	
		$application_data = array(
			'route_id' => $route_id,
			'user_id' => $user_id,
			'event_type' => $event_type,
			'about_event' => $about_event,
			'links' => $links,
			'status' => 'pending',
			'applied_at' => current_time('mysql')
		);
	
		error_log('Application data to be inserted/updated: ' . print_r($application_data, true));
	
		if ($existing_application) {
			if ($existing_application->status === 'pending') {
				error_log("An application for route $route_id is already pending");
				return new WP_Error('application_exists', "An application for route $route_id is already pending", array('status' => 400));
			} else {
				// Update existing application
				$updated = $wpdb->update(
					$applications_table,
					$application_data,
					array('id' => $existing_application->id),
					array('%s', '%d', '%s', '%s', '%s', '%s', '%s'),
					array('%d')
				);
	
				if ($updated === false) {
					error_log("Failed to update application for route $route_id. wpdb error: " . $wpdb->last_error);
					return new WP_Error('update_failed', 'Failed to update application', array('status' => 500));
				}
				error_log("Successfully updated application for route $route_id");
			}
		} else {
			// Create new application
			$inserted = $wpdb->insert(
				$applications_table,
				$application_data,
				array('%s', '%d', '%s', '%s', '%s', '%s', '%s')
			);
	
			if ($inserted === false) {
				error_log("Failed to create application for route $route_id. wpdb error: " . $wpdb->last_error);
				return new WP_Error('insert_failed', 'Failed to create application', array('status' => 500));
			}
			error_log("Successfully created new application for route $route_id");
		}
	
		return rest_ensure_response(array(
			'success' => true,
			'message' => 'Application submitted successfully'
		));
	}

	public function mmd_get_public_route_applications($request) {
		if (!current_user_can('manage_options')) {
			return new WP_Error('forbidden', 'You do not have permission to view applications', array('status' => 403));
		}
	
		global $wpdb;
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
		$routes_table = $wpdb->prefix . 'mmd_map_routes';
		$users_table = $wpdb->prefix . 'users';
	
		$status = isset($request['status']) ? sanitize_text_field($request['status']) : 'pending';
		$page = isset($request['page']) ? max(1, intval($request['page'])) : 1;
		$per_page = 10;
	
		error_log("Fetching applications with status: " . $status . ", page: " . $page);
	
		// Get counts
		$count_query = "SELECT 
							SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
							SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
							SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count
						FROM $applications_table";
		$counts = $wpdb->get_row($count_query);
		
		error_log("Counts query: " . $count_query);
		error_log("Counts result: " . print_r($counts, true));
	
		// Get applications based on status
		$where_clause = $wpdb->prepare("WHERE a.status = %s", $status);
		$limit_clause = $status === 'pending' 
			? $wpdb->prepare("LIMIT %d OFFSET %d", $per_page, ($page - 1) * $per_page)
			: "LIMIT 10";
	
		$query = "SELECT a.id, a.event_type, a.applied_at, r.id as route_id, r.route_name, 
						 u.ID as user_id, u.display_name as user_name
				  FROM $applications_table a
				  JOIN $routes_table r ON a.route_id = r.id
				  JOIN $users_table u ON a.user_id = u.ID
				  $where_clause
				  ORDER BY a.applied_at DESC
				  $limit_clause";
	
		error_log("Applications query: " . $query);
	
		$applications = $wpdb->get_results($query);
	
		error_log("Applications result: " . print_r($applications, true));
	
		if ($applications === null) {
			error_log("Query failed: " . $wpdb->last_error);
			return new WP_Error('query_failed', 'Failed to retrieve applications', array('status' => 500));
		}
	
		$site_url = get_site_url();
	
		foreach ($applications as &$app) {
			$app->route_url = $site_url . "/?route=" . $app->route_id;
			$app->user_profile_url = admin_url("user-edit.php?user_id=" . $app->user_id);
			$app->applied_at = mysql2date('F j, Y g:i a', $app->applied_at);
			// Use event_type directly
			$app->event_name = $app->event_type;
		}
	
		$total_pages = $status === 'pending' 
			? ceil($counts->pending_count / $per_page)
			: 1;
	
		$response = [
			'success' => true,
			'applications' => $applications,
			'counts' => $counts,
			'pagination' => [
				'current_page' => $page,
				'total_pages' => $total_pages,
				'per_page' => $per_page
			]
		];
	
		error_log("Final response: " . print_r($response, true));
	
		return rest_ensure_response($response);
	}
	
	public function mmd_admin_approve_public_route($request) {
		if (!current_user_can('manage_options')) {
			return new WP_Error('forbidden', 'You do not have permission to approve routes', array('status' => 403));
		}
	
		global $wpdb;
		$application_id = intval($request['id']);
		$approval_status = sanitize_text_field($request['status']); // 'approved' or 'denied'
		$admin_notes = sanitize_textarea_field($request['admin_notes']);
	
		$applications_table = $wpdb->prefix . 'mmd_public_route_applications';
		$routes_table = $wpdb->prefix . 'mmd_map_routes';
	
		// Get the application details
		$application = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM $applications_table WHERE id = %d",
			$application_id
		));
	
		if (!$application) {
			return new WP_Error('not_found', 'Application not found', array('status' => 404));
		}
	
		// Start transaction
		$wpdb->query('START TRANSACTION');
	
		try {
			// Update the application status
			$updated = $wpdb->update(
				$applications_table,
				array(
					'status' => $approval_status,
					'processed_at' => current_time('mysql'),
					'admin_notes' => $admin_notes
				),
				array('id' => $application_id),
				array('%s', '%s', '%s'),
				array('%d')
			);
	
			if ($updated === false) {
				throw new Exception('Failed to update application status');
			}
	
			// If approved, update the route
			if ($approval_status === 'approved') {
				$route_updated = $wpdb->update(
					$routes_table,
					array(
						'is_public' => true,
						'event_type' => $application->event_type
					),
					array('id' => $application->route_id),
					array('%d', '%s'),
					array('%s')
				);
	
				if ($route_updated === false) {
					throw new Exception('Failed to update route status');
				}
			}
	
			// Commit the transaction
			$wpdb->query('COMMIT');
	
			return rest_ensure_response(array(
				'success' => true,
				'message' => 'Application ' . $approval_status
			));
		} catch (Exception $e) {
			// Rollback the transaction in case of any error
			$wpdb->query('ROLLBACK');
			return new WP_Error('update_failed', $e->getMessage(), array('status' => 500));
		}
	}

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
