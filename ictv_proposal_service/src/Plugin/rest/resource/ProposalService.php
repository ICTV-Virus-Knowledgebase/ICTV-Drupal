<?php

namespace Drupal\ictv_proposal_service\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Psr\Log\LoggerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Provides a resource to get view modes by entity and bundle.
 * @RestResource(
 *   id = "ictv_proposal_service_resource",
 *   label = @Translation("ICTV Proposal Service"),
 *   uri_paths = {
 *     "canonical" = "/proposal-api",
 *     "create" = "/proposal-api"
 *   }
 * )
 */
class ProposalService extends ResourceBase {

    // "https://www.drupal.org/link-relations/create" = "/proposal-api"
  /**
   * A current user instance which is logged in the session.
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $loggedUser;

  /**
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  private $requestStack;

  /**
   * Constructs a Drupal\rest\Plugin\ResourceBase object.
   *
   * @param array $config
   *   A configuration array which contains the information about the plugin instance.
   * @param string $module_id
   *   The module_id for the plugin instance.
   * @param mixed $module_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \Psr\Log\LoggerInterface $logger
   *   A logger instance.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   A currently logged user instance.
   */
  public function __construct(
    array $config,
    $module_id,
    $module_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user,
    RequestStack $request_stack) {
    parent::__construct($config, $module_id, $module_definition, $serializer_formats, $logger);

    $this->requestStack = $request_stack;
    $this->loggedUser = $current_user;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $config, $module_id, $module_definition) {
    return new static(
      $config,
      $module_id,
      $module_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('ictv_proposal_resource'),
      $container->get('current_user'),
      $container->get('request_stack')
    );
  }

  /**
   * Responds to GET request.
   * Returns a list of taxonomy terms.
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   * Throws exception expected.
   */
  /*public function get() {

    $data = $this->processRequest();
    
    $response = new ResourceResponse($data);
    $response->addCacheableDependency($data);
    return $response;
  }*/


  public function getJobs($userUID_) {

    $jobUID = 1234;

    $jobs[] = array(
        'job_uid' => $jobUID
	);

    return $jobs;
  }


  public function post() {

    // Use currently logged user after passing authentication and validating the access of term list.
    /*if (!$this->loggedUser->hasPermission('access content')) {
        throw new AccessDeniedHttpException();
    }*/

    /*if (!$this->loggedUser->hasRole('proposal uploader')) {
        throw new AccessDeniedHttpException();
    }

    // Load the current user.
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $email = $user->get('mail')->value;
    $name = $user->get('name')->value;
    //$userUID= $user->get('uid')->value;
    */
    /*
    // Get parameters
    $actionCode = $this->requestStack->getCurrentRequest()->get('action_code');
    $userUID = $this->requestStack->getCurrentRequest()->get('user_uid');

    $data = null;

    switch ($actionCode) {

        case "get_jobs":

            $data = $this->getJobs();
            break;

        case "upload_proposal":
            $data = $this->uploadProposal($proposalFile, $userUID, $test);
            break;

        default:
            break;
    }

    $data[] = array(
        'test' => "testing..."
    );*/

    /*
    // Load the current user.
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $email = $user->get('mail')->value;
    $name = $user->get('name')->value;
    $uid= $user->get('uid')->value;


    $term_result[] = array(
        'uid' => $uid,
        'name' => $name,
        'email' => $email,
        'user_uid' => $userUID
    );
    */

    $data = $this->processRequest();

    $response = new ResourceResponse($data);
    $response->addCacheableDependency($data);
    return $response;
  }


  public function processRequest() {

    // Use currently logged user after passing authentication and validating the access of term list.
    /*if (!$this->loggedUser->hasPermission('access content')) {
        throw new AccessDeniedHttpException();
    }*/

    /*if (!$this->loggedUser->hasRole('proposal uploader')) {
        throw new AccessDeniedHttpException();
    }

    // Get the current user's email, name, and UID.
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $email = $user->get('mail')->value;
    $name = $user->get('name')->value;
    $userUID= $user->get('uid')->value;
    */

    // Get parameters
    $actionCode = $this->requestStack->getCurrentRequest()->get('action_code');
    $userUID = $this->requestStack->getCurrentRequest()->get('user_uid');
    
    $data = null;

    switch ($actionCode) {

        case "get_jobs":
            $data = $this->getJobs($userUID);
            break;

        case "upload_proposal":
            $data = $this->uploadProposal($proposalFile, $userUID, $test);
            break;

        default:
            break;
    }

    /*
    // Load the current user.
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $email = $user->get('mail')->value;
    $name = $user->get('name')->value;
    $uid= $user->get('uid')->value;


    $term_result[] = array(
        'uid' => $uid,
        'name' => $name,
        'email' => $email,
        'user_uid' => $userUID
    );
    */

    //$response = new ResourceResponse($data);
    //$response->addCacheableDependency($data);
    //return $response;

    return $data;
  }


  public function uploadProposal($userUID, $test) {

    $all_files = \Drupal::request()->files;

    //throw new Error($all_files);

    // Make sure there's an upload to process.
    $proposalFile = $this->requestStack->getCurrentRequest()->files[0];
    
    //$all_files->get("proposal");
    /*if (empty($proposalFile)) {
        return NULL;
    }*/


    $filename = $proposalFile->filename();

    $result[] = array(
        "filename" => $filename,
        'status' => "It worked",
        "test" => $test
	);

    return $result;
  }


}