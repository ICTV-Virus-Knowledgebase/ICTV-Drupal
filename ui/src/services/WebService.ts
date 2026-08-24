
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
         jsonParameters: false,
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
            definition.jsonParameters = true;
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

            if (data_ && !definition.jsonParameters) {

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
}

// Create a singleton instance of _WebService.
export const WebService = new _WebService();
