
import { IFileData } from "../models/IFileData";
import { IJob } from "../components/ProposalSubmission/IJob";
import { IUploadResult } from "../components/ProposalSubmission/IUploadResult";
import { IValidationSummary } from "../components/ProposalSubmission/IValidationSummary";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _ProposalService {

   // Get all of this user's submitted jobs.
   async getJobs(authToken_: string, userEmail_: string, userUID_: number): Promise<IJob[]> {

      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         actionCode: "get_jobs",
         userEmail: userEmail_,
         userUID: userUID_
      };

      let jobs: IJob[] = null;

      let jobsJSON = await WebService.drupalPost<string>(WebServiceKey.proposal, authToken_, data);
      if (!!jobsJSON) { 
         jobsJSON.replace("\u0022", "\""); 
         jobs = JSON.parse(jobsJSON);
         if (!jobs || !Array.isArray(jobs) || jobs.length < 1) { jobs = null; }
      }
      
      return jobs;
   }


   // Get the validation summary for a specific proposal file.
   async getValidationSummary(authToken_: string, jobUID_: string, userEmail_: string, userUID_: number): Promise<IValidationSummary> {
      
      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!jobUID_) { throw new Error("Invalid job UID"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }

      const data = {
         actionCode: "get_validation_summary",
         jobUID: jobUID_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      // Get and return the validation summary
      return await WebService.drupalPost<IValidationSummary>(WebServiceKey.proposal, authToken_, data);
   }


   // Upload one or more QC Proposals for validation.
   async uploadProposals(authToken_: string, files_: IFileData[], jobName_: string, userEmail_: string, 
      userUID_: number): Promise<IUploadResult> {

      // Validate parameters
      if (!files_ || files_.length < 1) { throw new Error("There are no files to upload"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         actionCode: "upload_proposals",
         files: files_,
         jobName: jobName_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.drupalPost<IUploadResult>(WebServiceKey.proposal, authToken_, data);
   }

}

// Create a singleton instance of _ProposalService.
export const ProposalService = new _ProposalService();