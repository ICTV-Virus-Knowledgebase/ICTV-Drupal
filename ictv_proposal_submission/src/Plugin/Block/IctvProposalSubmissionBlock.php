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

    /**
     * A current user instance which is logged in the session.
     * @var \Drupal\Core\Session\AccountProxyInterface
     */
    protected $loggedUser;



    /**
     * Constructs a Drupal\rest\Plugin\ResourceBase object.
     *
     * @param array $config
     *   A configuration array which contains the information about the plugin instance.
     * @param string $module_id
     *   The module_id for the plugin instance.
     * @param mixed $module_definition
     *   The plugin implementation definition.
     * @param \Drupal\Core\Session\AccountProxyInterface $current_user
     *   A currently logged user instance.
     */
    /*
    public function __construct(
        array $config,
        $module_id,
        $module_definition,
        AccountProxyInterface $current_user) {
        parent::__construct($config, $module_id, $module_definition);

        $this->loggedUser = $current_user;
    }*/


    /**
     * {@inheritdoc}
     */
    /*public static function create(ContainerInterface $container, array $config, $module_id, $module_definition) {
        return new static(
            $config,
            $module_id,
            $module_definition,
            $container->get('current_user')
        );
    }*/



    /**
     * {@inheritdoc}
     */
    public function build() {


        $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
        // TODO: how to raise/report an exception if this is null?

        // Use the default database instance.
        $database = \Drupal::database();

        // The currently logged in user.
        if (!$user->hasPermission('access content')) {
            throw new AccessDeniedHttpException();
        }

        /*if (!$this->loggedUser->hasRole('proposal uploader')) {
            throw new AccessDeniedHttpException();
        }*/

        // TODO: get authToken from ictv_settings
        // Get all ictv_settings
        // TODO: centralize this code somewhere else!
        $query = $database->query("SELECT ictv_settings.value AS authToken FROM ictv_settings WHERE NAME = 'authToken' ");

        $result = $query->fetchAll();

        // TODO: validate result!
        $authToken = $result[0]->authToken;
    
        // Get the current user's email, name, and UID.
        $email = $user->get('mail')->value;
        $name = $user->get('name')->value;
        $userUID = $user->get('uid')->value;

        $build = [
            '#markup' => $this->t("<div id=\"ictv_proposal_submission_container\" class=\"ictv-custom\">
                <div class=\"user-row\"></div>
                <div class=\"controls-row\">
                    Upload file: <input type=\"file\" class=\"proposal-ctrl\" /> <button class=\"btn upload-button\">upload</button>
                </div>
                <div class=\"jobs\"></div>
            </div>"),
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
        $build['#attached']['drupalSettings']['authToken'] = $authToken;
        $build['#attached']['drupalSettings']['userEmail'] = $email;
        $build['#attached']['drupalSettings']['userName'] = $name;
        $build['#attached']['drupalSettings']['userUID'] = $userUID;
        
        return $build;
    }

}