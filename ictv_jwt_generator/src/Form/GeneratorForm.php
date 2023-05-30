<?php

namespace Drupal\ictv_jwt_generator\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Database;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\jwt\JsonWebToken\JsonWebToken;
use Drupal\jwt\Transcoder\JwtTranscoder;
use Drupal\key\KeyRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;


class GeneratorForm extends FormBase {


    /**
     * The number of days until the token expires.
     * The default value is 10 years (3650 days)
     *
     * @var int
     */
    protected int $expirationDays = 3650;

    /**
     * The key repository.
     *
     * @var \Drupal\key\KeyRepositoryInterface
     */
    protected KeyRepository $keyRepo;

    protected string $token = "This will be replaced by the new JSON Web Token (JWT)";

    /**
     * The JWT transcoder.
     *
     * @var \Drupal\jwt\Transcoder\JwtTranscoder
     */
    protected JwtTranscoder $transcoder;

    /**
     * The current Drupal user.
     *
     * @var \Drupal\user\Entity\User
     */
    protected $user;

    
    // C-tor
    function __construct(
        ConfigFactoryInterface $config_factory,
        KeyRepository $key_repo,
        JwtTranscoder $transcoder
        ) {

        try {
            $this->keyRepo = $key_repo;
            $this->transcoder = $transcoder;
            $this->setConfigFactory($config_factory);

            // Get the current Drupal user.
            $this->user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
            if (!$this->user) {
                // TODO: raise an exception, instead of writing to the log.
                \Drupal::logger('ictv_jwt_generator')->error("Error in GeneratorForm: Invalid user");
            }
        }
        catch (Exception $e) {
            \Drupal::logger('ictv_jwt_generator')->error($e->getMessage());
        }
    }

    /**
     * {@inheritdoc}
     */
    public static function create(ContainerInterface $container) {
        return new static(
            $container->get('config.factory'),
            $container->get('key.repository'),
            $container->get('jwt.transcoder')
        );
    }


    /**
     * @return string
     */
    public function getFormId() {
        return 'ictv_jwt_generator_form';
    }

    /**
     * @param array $form
     * @param FormStateInterface $form_state
     * @return array
     */
    public function buildForm(array $form, FormStateInterface $form_state) {

        $email = $this->user->get('mail')->value;
        $name = $this->user->get('name')->value;
        $userUID = $this->user->get('uid')->value;

        $userText = $name." (".$email.")";

        // The current Drupal user
        $form['current_user'] = array(
            '#type' => 'item',
            '#title' => t('Authenticated User'),
            '#required' => FALSE,
            '#markup' => $userText
        );

        // The expiration time (in days)
        $form['expiration_days'] = array(
            '#type' => 'number',
            '#title' => t('Days until token expires'),
            '#required' => TRUE,
            '#default_value' => $this->expirationDays,
        );

        // The JSON web token
        $form['new_token'] = array(
            '#type' => 'textarea',
            '#title' => t('JSON Web Token'),
            '#required' => FALSE,
            '#default_value' => $this->token,
            '#access' => FALSE
        );

        $form['actions']['#type'] = 'actions';
        $form['actions']['submit'] = array(
            '#type' => 'submit',
            '#value' => $this->t('Generate token'),
            '#button_type' => 'primary',
        );

        return $form;
    }


    public function createJWT(int $expirationDays, string $userUID) {

        // The current date/time
        $now = date_create();

        // Convert to a timestamp
        $nowTS = date_timestamp_get($now);

        // Add the expiration days to the current date/time.
        $expiration = date_add($now, date_interval_create_from_date_string("{$expirationDays} days"));

        // Convert to a timestamp
        $expirationTS = date_timestamp_get($expiration);

        // Create a new JSON web token object and set the necessary claims.
        $jwt = new JsonWebToken();
        $jwt->setClaim('iat', $nowTS);
        $jwt->setClaim('exp', $expirationTS);
        $jwt->setClaim(['drupal', 'uid'], $userUID);

        // Encode and sign the JWT.
        $this->token = $this->transcoder->encode($jwt);

        return $this->token;
    }

    
    /**
     * Form submission handler.
     *
     * @param array $form
     *    An associative array containing the structure of the form.
     * @param \Drupal\Core\Form\FormStateInterface $form_state
     *    The current state of the form.
     */
    public function submitForm(array &$form, FormStateInterface $form_state) {

        $form_state->disableCache(TRUE);
        $form_state->disableRedirect(TRUE);
        
        // Get the user's UID.
        $userUID = $this->user->get('uid')->value;

        // Get the number of expiration days.
        $expirationDays = (int)$form_state->getValue('expiration_days');

        // Create the JSON web token and store it as the member variable "token".
        $this->createJWT($expirationDays, $userUID);

        // Populate the token textarea field.
        $form["new_token"]["#access"] = TRUE;
        $form["new_token"]["#value"] = $this->token;

        $this->messenger()->addStatus($this->t('The token was successfully created'));
    }


    /**
     * @param array $form
     * @param FormStateInterface $form_state
     */
    public function validateForm(array &$form, FormStateInterface $form_state) {
        // TODO?
    } 


}