
import { AppSettings } from "../global/AppSettings";
import axios, { AxiosResponse } from "axios";
import { WebServiceKey } from "../global/Types";

// HTTP request methods
enum RequestMethod {
   GET = "GET",
   POST = "POST",
   POST_JSON = "POST_JSON"
}


export class _WebService {


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
         // TODO: handle the exception!
         //AlertBuilder.displayError(`Error in ${webServiceKey_} WebService: ${getErrorMessage(error_)}`);
         result = null;
      }

      return result;
   }


   // Make an HTTP POST request to the specified web service.
   async drupalPost<T>(webServiceKey_: WebServiceKey, authToken_: string, data_?: any): Promise<T> {

      let result: T = null;

      // Get the name of the CSRF service.
      const csrfService = AppSettings.webServiceLookup[WebServiceKey.csrfToken];
      if (!csrfService) { throw new Error(`Unrecognized web service key ${WebServiceKey.csrfToken}`); }

      // Combine the Drupal web service URL with the CSRF web service.
      const csrfURL = `${AppSettings.drupalWebServiceURL}${csrfService}`;

      let csrfToken = null;

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



   // Make an HTTP GET request to the specified web service.
   async get<T>(webServiceKey_: WebServiceKey, data_?: any): Promise<T> {

      let result: T = null;

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the web service base URL with the web service.
      const url = `${AppSettings.baseWebServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(null, RequestMethod.GET, url, data_);
      }
      catch (error_) {
         // TODO: handle the exception!
         result = null;
      }

      return result;
   }


   // This is used by the get and post methods to make a web service request and return the results.
   protected async performRequest<T>(authToken_: string, method_: RequestMethod, 
      webServiceURL_: string, data_?: any, csrfToken_?: null): Promise<T> {

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


   // Make an HTTP POST request to the specified web service.
   async post<T>(webServiceKey_: WebServiceKey, data_?: any): Promise<T> {

      let result: T = null;

      // Lookup the web service using the key provided.
      const webService = AppSettings.webServiceLookup[webServiceKey_];
      if (!webService) { throw new Error(`Unrecognized web service key ${webServiceKey_}`); }

      // Combine the web service base URL with the web service.
      const url = `${AppSettings.baseWebServiceURL}${webService}`;

      try {
         result = await this.performRequest<T>(null, RequestMethod.POST, url, data_);
      }
      catch (error_) {
         // TODO: handle the exception!
         result = null;
      }

      return result;
   }

}

// Create a singleton instance of _WebService.
export const WebService = new _WebService();
