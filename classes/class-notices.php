<?php
/**
 * Scripts & Styles file
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Main plugin class.
 */
class MapMyDistance_Notices {
	/**
	 * Constructor funtion
	 */
	public function __construct() {
		add_action( 'admin_init', array($this, 'mmd_dismiss_notice' ), 0);
		add_action( 'admin_notices', array($this, 'mmd_add_update_notice' ));
	} // End __construct ()

	/**
	 * Add notices
	 */
	public function mmd_add_update_notice() {
		global $pagenow;
		global $current_user;
        $user_id = $current_user->ID;
		$mmd_page = isset( $_GET['page'] ) ? $pagenow . '?page=' . sanitize_text_field($_GET['page']) . '&' : sanitize_text_field($pagenow) . '?';

		$notices = $this->mmd_notices();

		$allowed_html = array(
			'b' => array('style' => array()),
		);

		if ( $pagenow == 'index.php' || $pagenow == 'plugins.php' || $pagenow == 'options-general.php' ) :

			if ( $notices ) :
				// Loop over all notices
				foreach ($notices as $notice) :

					if ( current_user_can( 'manage_options' ) && !get_user_meta( $user_id, 'mmd_notice_' . $notice['id'] . '_dismissed', true ) ) : ?>
						<div class="mmd-admin-notice notice notice-<?php echo isset($notice['type']) ? sanitize_html_class($notice['type']) : 'info'; ?>">
							<a href="<?php echo esc_url(admin_url($mmd_page . 'mmd_dismiss_notice&mmd-notice-id=' . $notice['id'])); ?>" class="notice-dismiss"></a>

							<div class="mmd-notice <?php echo isset($notice['inline']) ? esc_attr( 'inline' ) : ''; ?>">
								<?php if (isset($notice['title'])) : ?>
									<h4 class="mmd-notice-title"><?php echo wp_kses($notice['title'] ,$allowed_html); ?></h4>
								<?php endif; ?>

								<?php if (isset($notice['text'])) : ?>
									<p class="mmd-notice-text"><?php echo wp_kses($notice['text'] ,$allowed_html); ?></p>
								<?php endif; ?>

								<?php if (isset($notice['link']) && isset($notice['link_text'])) : ?>
									<a href="<?php echo esc_url($notice['link']); ?>" class="mmd-notice-btn">
										<?php esc_html_e($notice['link_text']); ?>
									</a>
								<?php endif; ?>
							</div>
						</div><?php
					endif;

				endforeach;
			endif;
			
		endif;
	}
	// Make Notice Dismissable
	public function mmd_dismiss_notice() {
		global $current_user;
		$user_id = $current_user->ID;

		if ( isset( $_GET['mmd_dismiss_notice'] ) ) {
			$mmd_notice_id = sanitize_text_field( $_GET['mmd-notice-id'] );
			add_user_meta( $user_id, 'mmd_notice_' .$mmd_notice_id. '_dismissed', 'true', true );
		}
    }

	/**
	 * Build Notices Array
	 */
	private function mmd_notices() {
		if ( !is_admin() )
			return;

		$settings = array();
		
		// $settings['new_blocks_added'] = array(
		// 	'id'    => 'newblocks_0001', // Increment this when adding new blocks
		// 	'type'  => 'info', // info | error | warning | success
		// 	'title' => __( 'New Advans,fh vsj dfced Slider & Content Toggler blocks have been added to the MMD plugin', 'mmd' ),
		// 	'text'  => __( 'To enable the new blocks and start using them in the WordPress editor:', 'mmd' ),
		// 	'link'  => admin_url( 'options-general.php?page=mmd-settings' ),
		// 	'link_text' => __( 'Go to the MMD settings', 'mmd' ),
		// 	'inline' => true, // To display the link & text inline
		// );

		// $settings['new_settings'] = array(
		// 	'id'    => '01',
		// 	'type'  => 'info',
		// 	'title' => __( 'MMD, manually added notice', 'mmd' ),
		// 	'text'  => __( 'Other notices can be added simply by adding then here in the code', 'mmd' ),
		// 	// 'link'  => admin_url( 'options-general.php?page=mmd-settings' ),
		// 	// 'link_text' => __( 'Go to Settings', 'mmd' ),
		// 	// 'inline' => true,
		// );

		return $settings;
	}
}
new MapMyDistance_Notices();
