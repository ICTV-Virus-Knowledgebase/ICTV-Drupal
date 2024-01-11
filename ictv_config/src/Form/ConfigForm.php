<?php

namespace Drupal\ictv_config\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Database\Connection;
use Symfony\Component\DependencyInjection\ContainerInterface;


class ConfigForm extends FormBase {

   // Constants for the form field identifiers.
   private $CONTROL_APPLICATION_URL = "applicationURL";
   private $CONTROL_AUTH_TOKEN = "authToken";
   private $CONTROL_BASE_WEB_SERVICE_URL = "baseWebServiceURL";
   private $CONTROL_CURRENT_MSL_RELEASE = "currentMslRelease";
   private $CONTROL_DRUPAL_WEB_SERVICE_URL = "drupalWebServiceURL";
   private $CONTROL_RELEASE_PROPOSALS_URL = "releaseProposalsURL";
   private $CONTROL_TAXON_HISTORY_PAGE = "taxonHistoryPage";

   // Variables to maintain form values populated from the database.
   public $applicationURL;
   public $authToken;
   public $baseWebServiceURL;
   public $currentMslRelease;
   public $drupalWebServiceURL;
   public $releaseProposalsURL;
   public $taxonHistoryPage;

   // The default database instance.
   public Connection $dbConnection;


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
      $this->loadData();

      // The website's base URL.
      $form[$this->CONTROL_APPLICATION_URL] = array(
         '#type' => 'url',
         '#title' => t('Application URL'),
         '#required' => TRUE,
         '#default_value' => $this->applicationURL,
      );

      // The JWT auth token used with the Drupal web services (the app server).
      $form[$this->CONTROL_AUTH_TOKEN] = array(
         '#type' => 'textarea',
         '#title' => t('JWT auth token'),
         '#required' => TRUE,
         '#default_value' => $this->authToken
      );

      // The base URL for web services.
      $form[$this->CONTROL_BASE_WEB_SERVICE_URL] = array(
         '#type' => 'url',
         '#title' => t('Web service URL'),
         '#required' => TRUE,
         '#default_value' => $this->baseWebServiceURL
      );

      // The current MSL release number.
      $form[$this->CONTROL_CURRENT_MSL_RELEASE] = array(
         '#type' => 'number',
         '#step' => '1',
         '#title' => t('Current MSL release number'),
         '#required' => TRUE,
         '#default_value' => $this->currentMslRelease
      );

      // The URL for Drupal web services (the app server).
      $form[$this->CONTROL_DRUPAL_WEB_SERVICE_URL] = array(
         '#type' => 'url',
         '#title' => t('Drupal web service URL'),
         '#required' => TRUE,
         '#default_value' => $this->drupalWebServiceURL
      );

      // The location of release proposal files.
      $form[$this->CONTROL_RELEASE_PROPOSALS_URL] = array(
         '#type' => 'url',
         '#title' => t('Location of release proposal files'),
         '#required' => TRUE,
         '#default_value' => $this->releaseProposalsURL
      );

      // The taxon history page name.
      $form[$this->CONTROL_TAXON_HISTORY_PAGE] = array(
         '#type' => 'textfield',
         '#title' => t('Taxon history page name'),
         '#required' => TRUE,
         '#default_value' => $this->taxonHistoryPage
      );

      $form['actions']['#type'] = 'actions';
      $form['actions']['submit'] = array(
         '#type' => 'submit',
         '#value' => $this->t('Save'),
         '#button_type' => 'primary',
      );

      return $form;
   }


   public function loadData() {

      // Initialize the member variables.
      $this->applicationURL = "";
      $this->authToken = "";
      $this->baseWebServiceURL = "";
      $this->currentMslRelease = NULL;
      $this->drupalWebServiceURL = "";
      $this->releaseProposalsURL = "";
      $this->taxonHistoryPage = "";

      // Get all ictv_settings
      $query = $this->dbConnection->query("SELECT * FROM {ictv_settings}");
      $result = $query->fetchAll();

      if ($result) { 
         foreach ($result as $setting) {

            switch ($setting->name) {
               case $this->CONTROL_APPLICATION_URL:
                  $this->applicationURL = $setting->value;
                  break;

               case $this->CONTROL_AUTH_TOKEN:
                  $this->authToken = $setting->value;
                  break;

               case $this->CONTROL_BASE_WEB_SERVICE_URL:
                  $this->baseWebServiceURL = $setting->value;
                  break;

               case $this->CONTROL_CURRENT_MSL_RELEASE:
                  $this->currentMslRelease = $setting->value;
                  break;

               case $this->CONTROL_DRUPAL_WEB_SERVICE_URL:
                  $this->drupalWebServiceURL = $setting->value;
                  break;

               case $this->CONTROL_RELEASE_PROPOSALS_URL:
                  $this->releaseProposalsURL = $setting->value;
                  break;

               case $this->CONTROL_TAXON_HISTORY_PAGE:
                  $this->taxonHistoryPage = $setting->value;
                  break;

               default:
                  break;
            }
         }
      }
   }


  /**
   * Save an ICTV setting name/value.
   */
   public function saveValue(string $name_, string $value_) : bool {

      if (is_null($this->dbConnection)) {
         \Drupal::logger('ictv_config_form')->error("Invalid db connection in saveValue");
         return false;
      }
      
      $success = $this->dbConnection->update('ictv_settings')
         ->fields([
            'value' => $value_,
            'updated_on' => date_create()->format('Y-m-d H:i:s'),
         ])
         ->condition('name', $name_, '=')
         ->execute();
      
      \Drupal::logger('ictv_config_form')->info("success = ".$success);

      if ($success == 1) {
         $this->messenger()->addStatus($this->t('Update successful'));
      } else {
         $this->messenger()->addStatus($this->t('Unable to update'));
      }
      
      return TRUE;
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

      // Get the application URL and save it.
      $value = $form_state->getValue($this->CONTROL_APPLICATION_URL);
      if (!$this->saveValue($this->CONTROL_APPLICATION_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_APPLICATION_URL, $this->t('Unable to save application URL.'));
      }
   
      // Get the JWT auth token and save it.
      $value = $form_state->getValue($this->CONTROL_AUTH_TOKEN);
      if (!$this->saveValue($this->CONTROL_AUTH_TOKEN, $value)) {
         $form_state->setErrorByName($this->CONTROL_AUTH_TOKEN, $this->t('Unable to save the JWT auth token.'));
      }

      // Get the base web service URL and save it.
      $value = $form_state->getValue($this->CONTROL_BASE_WEB_SERVICE_URL);
      if (!$this->saveValue($this->CONTROL_BASE_WEB_SERVICE_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_BASE_WEB_SERVICE_URL, $this->t('Unable to save base web service URL.'));
      }

      // Get the current MSL release and save it.
      $value = $form_state->getValue($this->CONTROL_CURRENT_MSL_RELEASE);
      if (!$this->saveValue($this->CONTROL_CURRENT_MSL_RELEASE, $value)) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_MSL_RELEASE, $this->t('Unable to save current MSL release.'));
      }
   
      // Get the current Drupal web service URL and save it.
      $value = $form_state->getValue($this->CONTROL_DRUPAL_WEB_SERVICE_URL);
      if (!$this->saveValue($this->CONTROL_DRUPAL_WEB_SERVICE_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_DRUPAL_WEB_SERVICE_URL, $this->t('Unable to save current Drupal web service URL.'));
      }
   
      // Get the release proposals URL and save it.
      $value = $form_state->getValue($this->CONTROL_RELEASE_PROPOSALS_URL);
      if (!$this->saveValue($this->CONTROL_RELEASE_PROPOSALS_URL, $value)) {
         $form_state->setErrorByName($this->CONTROL_RELEASE_PROPOSALS_URL, $this->t('Unable to save release proposals URL.'));
      }
   
      // Get the taxon history page and save it.
      $value = $form_state->getValue($this->CONTROL_TAXON_HISTORY_PAGE);
      if (!$this->saveValue($this->CONTROL_TAXON_HISTORY_PAGE, $value)) {
         $form_state->setErrorByName($this->CONTROL_TAXON_HISTORY_PAGE, $this->t('Unable to save taxon history page.'));
      }
   }


   /**
    * @param array $form
    * @param FormStateInterface $form_state
    */
   public function validateForm(array &$form, FormStateInterface $form_state) {
   
      // The application URL
      $value = $form_state->getValue($this->CONTROL_APPLICATION_URL);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_APPLICATION_URL, $this->t('Please enter a valid application URL.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_APPLICATION_URL, $value);
      }

      // The JWT auth token
      $value = $form_state->getValue($this->CONTROL_AUTH_TOKEN);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_AUTH_TOKEN, $this->t('Please enter a valid JWT auth token.'));
         
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_AUTH_TOKEN, $value);
      }

      // The base web service URL
      $value = $form_state->getValue($this->CONTROL_BASE_WEB_SERVICE_URL);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_BASE_WEB_SERVICE_URL, $this->t('Please enter a valid base web service URL.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_BASE_WEB_SERVICE_URL, $value);
      }

      // The current MSL release
      $value = $form_state->getValue($this->CONTROL_CURRENT_MSL_RELEASE);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_CURRENT_MSL_RELEASE, $this->t('Please enter a valid current MSL release.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_CURRENT_MSL_RELEASE, $value);
      }

      // The Drupal web service URL
      $value = $form_state->getValue($this->CONTROL_DRUPAL_WEB_SERVICE_URL);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_DRUPAL_WEB_SERVICE_URL, $this->t('Please enter a valid Drupal web service URL.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_DRUPAL_WEB_SERVICE_URL, $value);
      }

      // The release proposals URL
      $value = $form_state->getValue($this->CONTROL_RELEASE_PROPOSALS_URL);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_RELEASE_PROPOSALS_URL, $this->t('Please enter a valid release proposals URL.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_RELEASE_PROPOSALS_URL, $value);
      }

      // The taxon history page
      $value = $form_state->getValue($this->CONTROL_TAXON_HISTORY_PAGE);
      $value = trim($value); 
      if (strlen($value) < 1) {
         $form_state->setErrorByName($this->CONTROL_TAXON_HISTORY_PAGE, $this->t('Please enter a valid taxon history page.'));
      } else {
         // Replace the value with the trimmed version.
         $form_state->setValue($this->CONTROL_TAXON_HISTORY_PAGE, $value);
      }
   }


}