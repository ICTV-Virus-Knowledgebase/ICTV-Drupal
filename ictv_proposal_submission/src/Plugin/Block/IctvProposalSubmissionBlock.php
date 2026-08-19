<?php

namespace Drupal\ictv_proposal_submission\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Drupal\ictv_config\ConfigSettings;

/**
 * A Block for the ICTV proposal submission form.
 *
 * @Block(
 *   id = "ictv_proposal_submission_block",
 *   admin_label = @Translation("ICTV Proposal Submission block"),
 *   category = @Translation("ICTV"),
 * )
 */
class IctvProposalSubmissionBlock extends BlockBase {

   /**
    * {@inheritdoc}
    */
   public function build() {

      // Get and validate the current user
      $currentUser = \Drupal::currentUser();
      if (!$currentUser) { 
         \Drupal::logger('ictv_proposal_submission')->error("Current user is invalid"); 
         throw new \HttpException("Current user is invalid");
      }

      // Retrieve additional user details.
      $user = \Drupal\user\Entity\User::load($currentUser->id());

      // Make sure the user has permission to access content.
      // TODO: shouldn't we also make sure they have a specific "proposal submitter" role?
      if (!$user->hasPermission('access content')) { throw new AccessDeniedHttpException(); }

      // Use the default database instance.
      $database = \Drupal::database();
      
      // Configuration settings
      $settings = null;

      try {
         // Get the ICTV configuration settings from the database.
         $settings = new ConfigSettings($database);
      }
      catch (\Throwable $error) {
         
         \Drupal::logger('ictv_proposal_submission')->error(
            'Invalid ICTV configuration settings: @message',
            ['@message' => $error->getMessage()]
         );

         return [
            '#markup' => $this->t('The ICTV proposal submission is unavailable because configuration settings are invalid.'),
         ];
      }

      // Get the current user's email, name, and UID.
      $email = $user->get('mail')->value;
      $name = $user->get('name')->value;
      $userUID = $user->get('uid')->value;

      $build = [
         '#markup' => $this->t("<div id=\"ictv_proposal_submission_container\" class=\"ictv-custom\"></div>"),
         '#attached' => [
               'library' => [
                  'ictv_proposal_submission/ICTV_ProposalSubmission',
                  'ictv_proposal_submission/proposalSubmission'
               ],
         ],
      ];

      // Populate drupalSettings with variables needed by the ProposalSubmission object.
      $build['#attached']['drupalSettings']['appServerURL'] = $settings->appServerURL;
      $build['#attached']['drupalSettings']['authToken'] = $settings->authToken;
      $build['#attached']['drupalSettings']['userEmail'] = $email;
      $build['#attached']['drupalSettings']['userName'] = $name;
      $build['#attached']['drupalSettings']['userUID'] = $userUID;
      
      return $build;
   }


   /**
    * {@inheritdoc}
    * 
    * Prevent this block from being cached.
    */
   public function getCacheMaxAge() {
      return 2;
   }
}