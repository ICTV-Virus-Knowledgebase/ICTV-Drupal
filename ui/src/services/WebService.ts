
import { AppSettings } from "../global/AppSettings";
import axios, { AxiosResponse } from "axios";
import { HttpMethod, IWebServiceDefinition, WebServiceKey } from "../global/Types";

export class _WebService {


   // Get a CSRF token from the app server.
   async getCsrfToken(): Promise<string> {

      let csrfToken = "";

      if (!AppSettings.authToken) { throw new Error("Invalid auth token"); }

      // Get the app server URL from the AppSettings.
      let url = AppSettings.appServerURL;
      if (!url) { throw new Error("Invalid app server URL"); }

      if (!url.endsWith("/")) { url += "/"; }

      // Get the name of the CSRF service.
      const csrfService = AppSettings.webServiceLookup[WebServiceKey.csrfToken];
      if (!csrfService) { throw new Error(`Unrecognized web service key ${WebServiceKey.csrfToken}`); }

      // Combine the app server URL with the CSRF web service.
      const csrfURL = `${url}${csrfService}`;

      try {
         // Call the CSRF web service and wait for a response.
         let response: AxiosResponse = await axios.get(csrfURL, {
            headers: {
               ["Authorization"]: `Bearer ${AppSettings.authToken}`
            },
            params: null
         })

         // Validate the Axios response.
         if (!response || !response.data) { throw new Error("Invalid HTTP Response"); }

         csrfToken = response.data as string;
      }
      catch (error_) {
         const message = `Unable to retrieve CSRF token: ${error_}`;
         console.error(message);
         throw new Error(message);
      }

      return csrfToken;
   }

   // Choose the appropriate web service URL based on the web service key provided.
   getWebServiceDefinition(webServiceKey_: WebServiceKey): IWebServiceDefinition {

      // Set default values for the web service definition.
      let definition = {
         isDataJSON: false,
         method: HttpMethod.GET,
         url: "",
         useAuthToken: false,
         useCsrfToken: false
      } as IWebServiceDefinition;
      
      // The web service key determines the definition's attributes.
      switch(webServiceKey_) {

         // Proposal service endpoints
         case WebServiceKey.getProposalJobs:
         case WebServiceKey.getProposalValidationSummary:
         case WebServiceKey.uploadProposals:

         // TaxaBLAST endpoints
         case WebServiceKey.downloadTaxaBlastFile:
         case WebServiceKey.getTaxaBlastOutputFile:
         case WebServiceKey.getTaxaBlastJob:
         case WebServiceKey.searchTaxaBlastJobs:
         case WebServiceKey.uploadSequences:
            definition.method = HttpMethod.POST;
            definition.url = AppSettings.appServerURL;
            definition.useAuthToken = true;
            definition.useCsrfToken = true;
            break;

         default:
            definition.url = AppSettings.webServiceURL;
      }

      if (!definition.url.endsWith("/")) { definition.url += "/"; }

      let webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      definition.url += webService;
      
      return definition;
   }


   async requestData<T>(webserviceKey_: WebServiceKey, data_?: any): Promise<T> {

      let headers: { [key: string]: string } = {};     

      // Get the web service definition for the specified key.
      const definition = this.getWebServiceDefinition(webserviceKey_); 

      // Should we include an auth token?
      if (definition.useAuthToken) {
         if (!AppSettings.authToken) { throw new Error("Invalid auth token"); }
         headers["Authorization"] = `Bearer ${AppSettings.authToken}`;
      }

      // Should we include a CSRF token?
      if (definition.useCsrfToken) {
         let csrfToken = await this.getCsrfToken();
         if (!csrfToken) { throw new Error("Unable to retrieve CSRF token"); }

         headers["X-CSRF-TOKEN"] = csrfToken;
      }

      let response: AxiosResponse = undefined;

      switch(definition.method) {

         case HttpMethod.GET:
            response = await axios.get(definition.url, {
               headers: headers,
               params: data_
            })

            break;

         case HttpMethod.POST:

            let data: any | FormData = data_;

            if (data_ && !definition.isDataJSON) {

               // Initialize the form data.
               data = new FormData();

               // Convert the JSON data to form data.
               Object.keys(data_).forEach((key_: string) => {
                  const value = data_[key_];
                  data.set(key_, value);
               })
            }

            response = await axios.post(definition.url, data, {
               headers: headers
            })

            break;
            
         default:
            throw new Error(`Unsupported request method: ${definition.method}`);
      }

      // Validate the Axios response.
      if (!response || !response.data) { throw new Error("Invalid HTTP Response"); }

      return response.data as T;
   }



   /*
   // Make an HTTP GET request to the specified web service.
   async drupalGet<T>(webServiceKey_: WebServiceKey, authToken_: string, data_?: any): Promise<T> {

      let result: T = null;

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the Drupal web service URL with the web service.
      const url = `${AppSettings.drupalWebServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(authToken_, RequestMethod.GET, url, data_);
      }
      catch (error_) {
         console.error(`Error in ${webServiceKey_} WebService:`, error_);
         result = null;
      }

      return result;
   }*/

/*
   // Make an HTTP POST request to the specified web service.
   async drupalPost<T>(webServiceKey_: WebServiceKey, authToken_: string, data_?: any): Promise<T> {

      let result: T = null;

      // Get the name of the CSRF service.
      const csrfService = AppSettings.webServiceLookup[WebServiceKey.csrfToken];
      if (!csrfService) { throw new Error(`Unrecognized web service key ${WebServiceKey.csrfToken}`); }

      // Combine the Drupal web service URL with the CSRF web service.
      const csrfURL = `${AppSettings.drupalWebServiceURL}${csrfService}`;

      let csrfToken = "";

      try {
         // Get a CSRF token to include in the web request.
         csrfToken = await this.performRequest<string>(authToken_, RequestMethod.GET, csrfURL);
      }
      catch (error_) {
         // TODO: handle the exception!
         console.error(`Invalid CSRF token in drupalPost: ${error_}`);
         return null;
      }

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the Drupal web service URL with the web service.
      const url = `${AppSettings.drupalWebServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(authToken_, RequestMethod.POST_JSON, url, data_, csrfToken);
      }
      catch (error_) {
         // TODO: handle the exception!
         console.log("in drupalPost error is ", error_)
      }

      return result;
   }
*/

/*
   // Make an HTTP GET request to the specified web service.
   async get<T>(webServiceKey_: WebServiceKey, data_?: any): Promise<T> {

      let result: T = null;

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the web service base URL with the web service.
      const url = `${AppSettings.webServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(null, RequestMethod.GET, url, data_);
      }
      catch (error_) {
         // TODO: handle the exception!
         result = null;
      }

      return result;
   }*/

/*
   // This is used by the get and post methods to make a web service request and return the results.
   protected async performRequest<T>(authToken_: string, method_: RequestMethod, 
      webServiceURL_: string, data_?: any, csrfToken_?: string): Promise<T> {

      // Validate input parameters
      if (!method_) { throw new Error("Invalid HTTP request method"); }
      if (!webServiceURL_) { throw new Error("Invalid web service URL"); }

      let response: AxiosResponse;

      let authHeaderValue = '';
      if (!!authToken_) { authHeaderValue = `Bearer ${authToken_}`; }

      switch (method_) {

         case RequestMethod.GET:

            // Call the web service and wait for a response.
            response = await axios.get(webServiceURL_, {
               headers: {
                  ["Authorization"]: authHeaderValue
               },
               params: data_
            })
            
            break;

         case RequestMethod.POST:

            // Initialize the form data.
            let formData: FormData = new FormData();

            // Convert the JSON data to form data.
            Object.keys(data_).forEach((key_: string) => {
               const value = data_[key_];
               formData.set(key_, value);
            })
            
            // Call the web service and wait for a response.
            response = await axios.post(webServiceURL_, formData, {
               headers: {
                  ["Authorization"]: authHeaderValue
               }
            })

            break;

         case RequestMethod.POST_JSON:

            // Call the web service and wait for a response.
            response = await axios.post(webServiceURL_, data_, {
               headers: {
                  ["Authorization"]: authHeaderValue,
                  ["X-CSRF-TOKEN"]: csrfToken_
               }
            })
            
            break;

         default:
            throw new Error(`Unhandled request method ${method_}`);
      }

      // Validate the Axios response.
      if (!response || !response.data) { throw new Error("Invalid HTTP Response"); }

      return response.data as T;
   }
*/

/*

   // Make an HTTP POST request to the specified web service.
   async post<T>(webServiceKey_: WebServiceKey, data_?: any): Promise<T> {

      let result: T = null;

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the web service base URL with the web service.
      const url = `${AppSettings.webServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(null, RequestMethod.POST, url, data_);
      }
      catch (error_) {
         // TODO: handle the exception!
         result = null;
      }

      return result;
   }
   */

   /*
   public async postFiles<T>(authToken_: string, data_: any, files_: FileList, webServiceKey_: WebServiceKey): Promise<T> {

      if (!authToken_) { throw new Error("Unable to post files: Invalid auth token"); }
      if (!files_) { throw new Error("Unable to post files: No files provided"); }

      // Get the name of the CSRF service.
      const csrfService = AppSettings.webServiceLookup[WebServiceKey.csrfToken];
      if (!csrfService) { throw new Error(`Unable to post files: Unrecognized web service key ${WebServiceKey.csrfToken}`); }

      // Combine the Drupal web service URL with the CSRF web service.
      const csrfURL = `${AppSettings.drupalWebServiceURL}${csrfService}`;

      let csrfToken = null;

      try {
         // Get a CSRF token to include in the web request.
         csrfToken = await this.performRequest<string>(authToken_, RequestMethod.GET, csrfURL);
      }
      catch (error_) {
         console.error(`Unable to post files: Invalid CSRF token in drupalPost: ${error_}`);
         return null;
      }

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unable to post files: Unrecognized web service key ${webServiceKey_}`); }

      // Combine the Drupal web service URL with the web service.
      const url = `${AppSettings.drupalWebServiceURL}${webService}`;

      // Initialize the form data.
      let formData: FormData = new FormData();

      Array.from(files_).forEach((file_) => {
         formData.append("files[]", file_);
      })

      if (data_) {

         // Convert the JSON data to form data.
         Object.keys(data_).forEach((key_: string) => {
            const value = data_[key_];
            formData.set(key_, value);
         })
      }

      // Call the web service and wait for a response.
      let response: AxiosResponse = await axios.post(url, formData, {
         headers: {
            ["Authorization"]: `Bearer ${authToken_}`,
            ["X-CSRF-TOKEN"]: csrfToken
         }
      })

      // Validate the Axios response.
      if (!response || !response.data) { throw new Error("Invalid HTTP Response"); }

      return response.data as T;
   }*/




}

// Create a singleton instance of _WebService.
export const WebService = new _WebService();
