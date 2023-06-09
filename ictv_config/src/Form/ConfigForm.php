<?php

namespace Drupal\ictv_config\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Database;


class ConfigForm extends FormBase {

    // Variables to maintain form values populated from the database.
    public $applicationURL;
    public $authToken;
    public $baseWebServiceURL;
    public $currentMslRelease;
    public $drupalWebServiceURL;
    public $releaseProposalsURL;
    public $taxonHistoryPage;

    // The default database instance.
    public $database;


    // C-tor
    function __construct() {

        // Use the default database instance.
        $this->database = \Drupal::database();
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
        self::loadData();

        // The website's base URL.
        $form['applicationURL'] = array(
            '#type' => 'url',
            '#title' => t('Application URL'),
            '#required' => TRUE,
            '#default_value' => $this->applicationURL,
        );

        // The JWT auth token used with the Drupal web services (the app server).
        $form['authToken'] = array(
            '#type' => 'textarea',
            '#title' => t('JWT auth token'),
            '#required' => TRUE,
            '#default_value' => $this->authToken
        );

        // The base URL for web services.
        $form['baseWebServiceURL'] = array(
            '#type' => 'url',
            '#title' => t('Web service URL'),
            '#required' => TRUE,
            '#default_value' => $this->baseWebServiceURL
        );

        // The current MSL release number.
        $form['currentMslRelease'] = array(
            '#type' => 'number',
            '#step' => '1',
            '#title' => t('Current MSL release number'),
            '#required' => TRUE,
            '#default_value' => $this->currentMslRelease
        );

        // The URL for Drupal web services (the app server).
        $form['drupalWebServiceURL'] = array(
            '#type' => 'url',
            '#title' => t('Drupal web service URL'),
            '#required' => TRUE,
            '#default_value' => $this->drupalWebServiceURL
        );

        // The location of release proposal files.
        $form['releaseProposalsURL'] = array(
            '#type' => 'url',
            '#title' => t('Location of release proposal files'),
            '#required' => TRUE,
            '#default_value' => $this->releaseProposalsURL
        );

        // The taxon history page name.
        $form['taxonHistoryPage'] = array(
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
        $query = $this->database->query("SELECT * FROM {ictv_settings}");
        $result = $query->fetchAll();

        if ($result) { 
            foreach ($result as $setting) {

                switch ($setting->name) {
                    case "applicationURL":
                        $this->applicationURL = $setting->value;
                        break;

                    case "authToken":
                        $this->authToken = $setting->value;
                        break;

                    case "baseWebServiceURL":
                        $this->baseWebServiceURL = $setting->value;
                        break;

                    case "currentMslRelease":
                        $this->currentMslRelease = $setting->value;
                        break;

                    case "drupalWebServiceURL":
                        $this->drupalWebServiceURL = $setting->value;
                        break;

                    case "releaseProposalsURL":
                        $this->releaseProposalsURL = $setting->value;
                        break;

                    case "taxonHistoryPage":
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

        // Create a prepared statement.
        $ps = $this->database->prepare(
            "UPDATE ictv_settings SET 
                ictv_settings.value = :value,
                ictv_settings.updated_on = CURRENT_TIMESTAMP 
            WHERE ictv_settings.name = :name "
        );

        // Bind variables to the prepared statement.
        $ps->bindParam(":value", $value_, \PDO::PARAM_STR);
        $ps->bindParam(":name", $name_, \PDO::PARAM_STR);
        
        // Execute the prepared statement.
        $success = $ps->execute();

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
        $value = $form_state->getValue('applicationURL');
        if (!$this->saveValue("applicationURL", $value)) {
            $form_state->setErrorByName('applicationURL', $this->t('Unable to save application URL.'));
        }
    
        // Get the JWT auth token and save it.
        $value = $form_state->getValue('authToken');
        if (!$this->saveValue("authToken", $value)) {
            $form_state->setErrorByName('authToken', $this->t('Unable to save the JWT auth token.'));
        }

        // Get the base web service URL and save it.
        $value = $form_state->getValue('baseWebServiceURL');
        if (!$this->saveValue("baseWebServiceURL", $value)) {
            $form_state->setErrorByName('baseWebServiceURL', $this->t('Unable to save base web service URL.'));
        }

        // Get the current MSL release and save it.
        $value = $form_state->getValue('currentMslRelease');
        if (!$this->saveValue("currentMslRelease", $value)) {
            $form_state->setErrorByName('currentMslRelease', $this->t('Unable to save current MSL release.'));
        }
    
        // Get the current Drupal web service URL and save it.
        $value = $form_state->getValue('drupalWebServiceURL');
        if (!$this->saveValue("drupalWebServiceURL", $value)) {
            $form_state->setErrorByName('drupalWebServiceURL', $this->t('Unable to save current Drupal web service URL.'));
        }
    
        // Get the release proposals URL and save it.
        $value = $form_state->getValue('releaseProposalsURL');
        if (!$this->saveValue("releaseProposalsURL", $value)) {
            $form_state->setErrorByName('releaseProposalsURL', $this->t('Unable to save release proposals URL.'));
        }
    
        // Get the taxon history page and save it.
        $value = $form_state->getValue('taxonHistoryPage');
        if (!$this->saveValue("taxonHistoryPage", $value)) {
            $form_state->setErrorByName('taxonHistoryPage', $this->t('Unable to save taxon history page.'));
        }
    }


    /**
     * @param array $form
     * @param FormStateInterface $form_state
     */
    public function validateForm(array &$form, FormStateInterface $form_state) {
    
        // The application URL
        $value = $form_state->getValue('applicationURL');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('applicationURL', $this->t('Please enter a valid application URL.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('applicationURL', $value);
        }

        // The JWT auth token
        $value = $form_state->getValue('authToken');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('authToken', $this->t('Please enter a valid JWT auth token.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('authToken', $value);
        }

        // The base web service URL
        $value = $form_state->getValue('baseWebServiceURL');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('baseWebServiceURL', $this->t('Please enter a valid base web service URL.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('baseWebServiceURL', $value);
        }

        // The current MSL release
        $value = $form_state->getValue('currentMslRelease');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('currentMslRelease', $this->t('Please enter a valid current MSL release.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('currentMslRelease', $value);
        }

        // The Drupal web service URL
        $value = $form_state->getValue('drupalWebServiceURL');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('drupalWebServiceURL', $this->t('Please enter a valid Drupal web service URL.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('drupalWebServiceURL', $value);
        }

        // The release proposals URL
        $value = $form_state->getValue('releaseProposalsURL');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('releaseProposalsURL', $this->t('Please enter a valid release proposals URL.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('releaseProposalsURL', $value);
        }

        // The taxon history page
        $value = $form_state->getValue('taxonHistoryPage');
        $value = trim($value); 
        if (strlen($value) < 1) {
            $form_state->setErrorByName('taxonHistoryPage', $this->t('Please enter a valid taxon history page.'));
        } else {
            // Replace the value with the trimmed version.
            $form_state->setValue('taxonHistoryPage', $value);
        }
    }


}