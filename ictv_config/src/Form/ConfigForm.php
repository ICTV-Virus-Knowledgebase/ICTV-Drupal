<?php

namespace Drupal\ictv_config\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\ictv_config\ConfigSettings;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;


class ConfigForm extends FormBase {

   // Constants for the form field identifiers.
   private $CONTROL_APP_SERVER_URL = "appServerURL";
   private $CONTROL_AUTH_TOKEN = "authToken";
   private $CONTROL_CURRENT_MSL_RELEASE = "currentMslRelease";
   private $CONTROL_CURRENT_VMR = "currentVMR";
   private $CONTROL_RELEASE_PROPOSALS_URL = "releaseProposalsURL";
   private $CONTROL_TAXON_DETAILS_PAGE = "taxonDetailsPage";
   private $CONTROL_WEB_SERVICE_URL = "webServiceURL";

   // The default database instance.
   public Connection $dbConnection;

   // Variables to maintain form values populated from the database.
   private ConfigSettings $settings;


   // C-tor
   function __construct(Connection $dbConnection) {

      if (is_null($dbConnection)) { throw new \Exception("The database connection is invalid or null."); }

      $this->dbConnection = $dbConnection;
   }

   /**
   * {@inheritdoc}
   */
   public static function create(ContainerInterface $container) {
      
      // Instantiate the form class.
      return new static(
         $container->get("database")
      );
   }

   /**
    * @return string
    */
   public function getFormId() {
      return 'ictv_config_form';
   }

   /**
    * @param array $form
    * @param FormStateInterface $form_state
    * @return array
    */
   public function buildForm(array $form, FormStateInterface $form_state) {

      // Load the default values from the database.
      $this->settings = new ConfigSettings($this->dbConnection);
      //$this->loadData();

      // The URL for web services on the app server.
      $form[$this->CONTROL_APP_SERVER_URL] = array(
         '#type' => 'url',
         '#title' => t('App server URL'),
         '#required' => FALSE,
         '#default_value' => $this->settings->appServerURL,
      );

      // The JWT auth token used with the app server web services.
      $form[$this->CONTROL_AUTH_TOKEN] = array(
         '#type' => 'textarea',
         '#title' => t('JWT auth token'),
         '#required' => FALSE,
         '#default_value' => $this->settings->authToken
      );

      // The current MSL release number.
      $form[$this->CONTROL_CURRENT_MSL_RELEASE] = array(
         '#type' => 'number',
         '#step' => '1',
         '#title' => t('Current MSL release number'),
         '#required' => FALSE,
         '#default_value' => $this->settings->currentMslRelease
      );

      // The current VMR.
      $form[$this->CONTROL_CURRENT_VMR] = array(
         '#type' => 'textfield',
         '#step' => '1',
         '#title' => t('Current VMR'),
         '#required' => FALSE,
         '#default_value' => $this->settings->currentVMR
      );

      // The location of release proposal files.
      $form[$this->CONTROL_RELEASE_PROPOSALS_URL] = array(
         '#type' => 'url',
         '#title' => t('Location of release proposal files'),
         '#required' => FALSE,
         '#default_value' => $this->settings->releaseProposalsURL
      );

      // The taxon details page name.
      $form[$this->CONTROL_TAXON_DETAILS_PAGE] = array(
         '#type' => 'textfield',
         '#title' => t('Taxon details page name'),
         '#required' => FALSE,
         '#default_value' => $this->settings->taxonDetailsPage
      );

      // The base URL for web services.
      $form[$this->CONTROL_WEB_SERVICE_URL] = array(
         '#type' => 'url',
         '#title' => t('Web service URL'),
         '#required' => TRUE,
         '#default_value' => $this->settings->webServiceURL
      );

      $form['actions']['#type'] = 'actions';
      $form['actions']['submit'] = array(
         '#type' => 'submit',
         '#value' => $this->t('Save'),
         '#button_type' => 'primary',
      );

      return $form;
   }


  /**
   * Save an ICTV setting name/value.
   */
   public function saveValue(string $name_, string $value_) : bool {

      if (is_null($this->dbConnection)) {
         \Drupal::logger('ictv_config_form')->error("Invalid db connection in saveValue");
         return FALSE;
      }
      
      // Update ICTV Settings in the database.
      $success = $this->dbConnection->update('ictv_settings')
         ->fields([
            'value' => $value_,
            'updated_on' => date_create()->format('Y-m-d H:i:s'),
         ])
         ->condition('name', $name_, '=')
         ->execute();
      
      if ($success == 1) {
         $this->messenger()->addStatus($this->t('Update successful'));
         return TRUE;
      }
      
      $this->messenger()->addError($this->t('Unable to update'));
      return FALSE;
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

      // TODO: Instead of handling each control independently, iterate over a list of control keys!
      
      // Get the app server URL and save it.
      $value = $form_state->getValue($this->CONTROL_APP_SERVER_URL);
      if (!$this->saveValue($this->CONTROL_APP_SERVER_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_APP_SERVER_URL, $this->t('Unable to save app server URL.'));
      }
   
      // Get the JWT auth token and save it.
      $value = $form_state->getValue($this->CONTROL_AUTH_TOKEN);
      if (!$this->saveValue($this->CONTROL_AUTH_TOKEN, $value)) {
         $form_state->setErrorByName($this->CONTROL_AUTH_TOKEN, $this->t('Unable to save the JWT auth token.'));
      }

      // Get the base web service URL and save it.
      $value = $form_state->getValue($this->CONTROL_WEB_SERVICE_URL);
      if (!$this->saveValue($this->CONTROL_WEB_SERVICE_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_WEB_SERVICE_URL, $this->t('Unable to save web service URL.'));
      }

      // Get the current MSL release and save it.
      $value = $form_state->getValue($this->CONTROL_CURRENT_MSL_RELEASE);
      if (!$this->saveValue($this->CONTROL_CURRENT_MSL_RELEASE, $value)) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_MSL_RELEASE, $this->t('Unable to save current MSL release.'));
      }
   
      // Get the current VMR and save it.
      $value = $form_state->getValue($this->CONTROL_CURRENT_VMR);
      if (!$this->saveValue($this->CONTROL_CURRENT_VMR, $value)) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_VMR, $this->t('Unable to save current VMR.'));
      }
   
      // Get the release proposals URL and save it.
      $value = $form_state->getValue($this->CONTROL_RELEASE_PROPOSALS_URL);
      if (!$this->saveValue($this->CONTROL_RELEASE_PROPOSALS_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_RELEASE_PROPOSALS_URL, $this->t('Unable to save release proposals URL.'));
      }
   
      // Get the taxon details page and save it.
      $value = $form_state->getValue($this->CONTROL_TAXON_DETAILS_PAGE);
      if (!$this->saveValue($this->CONTROL_TAXON_DETAILS_PAGE, $value)) {
         $form_state->setErrorByName($this->CONTROL_TAXON_DETAILS_PAGE, $this->t('Unable to save taxon details page.'));
      }
   }


   /**
    * @param array $form
    * @param FormStateInterface $form_state
    */
   public function validateForm(array &$form, FormStateInterface $form_state) {
   
      // The app server URL
      $value = $form_state->getValue($this->CONTROL_APP_SERVER_URL);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_APP_SERVER_URL, $this->t('Please enter a valid URL.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_APP_SERVER_URL, $value);
      }

      // The JWT auth token
      $value = $form_state->getValue($this->CONTROL_AUTH_TOKEN);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_AUTH_TOKEN, $this->t('Please enter a valid JWT auth token'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_AUTH_TOKEN, $value);
      }

      // The current MSL release
      $value = $form_state->getValue($this->CONTROL_CURRENT_MSL_RELEASE);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_MSL_RELEASE, $this->t('Please enter a valid integer'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_CURRENT_MSL_RELEASE, $value);
      }

      // The current VMR
      $value = $form_state->getValue($this->CONTROL_CURRENT_VMR);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_VMR, $this->t('Please enter a valid current VMR'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_CURRENT_VMR, $value);
      }

      // The release proposals URL
      $value = $form_state->getValue($this->CONTROL_RELEASE_PROPOSALS_URL);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_RELEASE_PROPOSALS_URL, $this->t('Please enter a valid URL'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_RELEASE_PROPOSALS_URL, $value);
      }

      // The taxon details page
      $value = $form_state->getValue($this->CONTROL_TAXON_DETAILS_PAGE);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_TAXON_DETAILS_PAGE, $this->t('Please enter a valid URL relative to the website root'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_TAXON_DETAILS_PAGE, $value);
      }

      // The web service URL
      $value = $form_state->getValue($this->CONTROL_WEB_SERVICE_URL);
      $value = trim($value); 
      if (is_null($value) || mb_strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_WEB_SERVICE_URL, $this->t('Please enter a valid URL'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_WEB_SERVICE_URL, $value);
      }
   }


}