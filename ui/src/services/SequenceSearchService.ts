
import { ISeqSearchJob } from "../components/SequenceSearch/ISeqSearchJob";
import { IFileData } from "../models/IFileData";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _SequenceSearchService {


   // Get the search results for a specific job.
   async getSearchResult(authToken_: string, jobUID_: string, userEmail_: string, userUID_: string): Promise<ISeqSearchJob> {
      
      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!jobUID_) { throw new Error("Invalid job UID"); }
      if (!userUID_) { throw new Error("The user UID parameter is invalid"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }

      const data = {
         authToken: authToken_,
         jobUID: jobUID_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      // Get and return the sequence search result.
      return await WebService.drupalPost<ISeqSearchJob>(WebServiceKey.getSequenceSearchResult, authToken_, data);
   }

   
   // Upload one or more sequences for processing.
   async uploadSequences(authToken_: string, files_: IFileData[], jobName_: string, userEmail_: string, 
      userUID_: string): Promise<ISeqSearchJob> {

      // Validate parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!files_ || files_.length < 1) { throw new Error("There are no files to upload"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }
      if (!userUID_) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         authToken: authToken_,
         files: files_,
         jobName: jobName_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.drupalPost<ISeqSearchJob>(WebServiceKey.uploadSequences, authToken_, data);
   } 


   
   /*
   // Get all of this user's sequence search results (jobs).
   async getSearchResults(authToken_: string, userEmail_: string, userUID_: string): Promise<ISeqSearchJob[]> {

      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }
      if (!userUID_) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         authToken: authToken_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      let jobs: ISeqSearchJob[] = null;

      let jobsJSON = await WebService.drupalPost<string>(WebServiceKey.getClassifiedSequences, authToken_, data);
      if (!!jobsJSON) { 
         jobs = JSON.parse(jobsJSON);
         if (!jobs || !Array.isArray(jobs) || jobs.length < 1) { jobs = null; }
      }
      
      return jobs;
   }*/

}

// Create a singleton instance of _SequenceSearchService.
export const SequenceSearchService = new _SequenceSearchService();