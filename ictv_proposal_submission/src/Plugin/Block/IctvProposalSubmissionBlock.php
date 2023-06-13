<?php

namespace Drupal\ictv_proposal_submission\Plugin\Block;

use Drupal\Core\Block\BlockBase;

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


    public $authToken;
    public $drupalWebServiceURL;

    /**
     * A current user instance which is logged in the session.
     * @var \Drupal\Core\Session\AccountProxyInterface
     */
    protected $loggedUser;



    /**
     * {@inheritdoc}
     */
    public function build() {

        // Get and validate the current user
        $currentUser = \Drupal::currentUser();
        if (!$currentUser) { 
            \Drupal::logger('ictv_proposal_service')->error("Current user is invalid"); 
            throw new HttpException("Current user is invalid");
        }

        // Load the current user object by ID
        $user = \Drupal\user\Entity\User::load($currentUser->id());

        // The currently logged in user.
        if (!$user->hasPermission('access content')) { throw new AccessDeniedHttpException(); }

        // Load the authToken and drupalWebServiceURL from the database.
        $this->loadData();

        // Get the current user's email, name, and UID.
        $email = $user->get('mail')->value;
        $name = $user->get('name')->value;
        $userUID = $user->get('uid')->value;

        
        $build = [
            '#markup' => $this->t("<div id=\"ictv_proposal_submission_container\" class=\"ictv-custom\"></div>"),
            '#attached' => [
                'library' => [
                    'ictv_proposal_submission/ICTV',
                ],
                'library' => [
                    'ictv_proposal_submission/proposalSubmission',
                ],
            ],
        ];

        // Populate drupalSettings with variables needed by the ProposalSubmission object.
        $build['#attached']['drupalSettings']['authToken'] = $this->authToken;
        $build['#attached']['drupalSettings']['drupalWebServiceURL'] = $this->drupalWebServiceURL;
        $build['#attached']['drupalSettings']['userEmail'] = $email;
        $build['#attached']['drupalSettings']['userName'] = $name;
        $build['#attached']['drupalSettings']['userUID'] = $userUID;
        
        return $build;
    }


    public function loadData() {

        // Use the default database instance.
        $database = \Drupal::database();

        // Initialize the member variables.
        $this->authToken = "";
        $this->drupalWebServiceURL = "";

        // Get authToken and drupalWebServiceURL from the ictv_settings table.
        $sql = 
            "SELECT (".
            "   SELECT a.value ".
            "   FROM {ictv_settings} a ".
            "    WHERE a.NAME = 'authToken' ".
            ") AS authToken, ".
            "(".
            "    SELECT d.value ".
            "    FROM {ictv_settings} d ".
            "    WHERE d.NAME = 'drupalWebServiceURL' ".
            ") AS drupalWebServiceURL ";

        $query = $database->query($sql);
        if (!$query) { \Drupal::logger('ictv_proposal_service')->error("Invalid query object"); }

        $result = $query->fetchAll();
        if (!$result) { \Drupal::logger('ictv_proposal_service')->error("Invalid result object"); }

        foreach ($result as $setting) {

            // Populate member variables
            $this->authToken = $setting->authToken;
            $this->drupalWebServiceURL = $setting->drupalWebServiceURL;
        }

        // TODO: validate?
    }

}