
import { IFileData } from "../models/IFileData";
import { IResult } from "../models/IResult";
import { IUploadResult } from "../components/ProposalSubmission/IUploadResult";
import { IValidationSummary } from "../components/ProposalSubmission/IValidationSummary";
import { WebService } from "./WebService";
import { WebServiceKey } from "../global/Types";


export class _ProposalService {

   // Get all of this user's submitted jobs.
   async getJobs(authToken_: string, userEmail_: string, userUID_: number): Promise<IResult> {

      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.requestData<IResult>(WebServiceKey.getProposalJobs, data);
   }


   // Get the validation summary for a specific proposal file.
   async getValidationSummary(authToken_: string, jobUID_: string, userEmail_: string, userUID_: number): Promise<IResult> {
      
      // Validate the parameters
      if (!authToken_) { throw new Error("Invalid auth token"); }
      if (!jobUID_) { throw new Error("Invalid job UID"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }

      const data = {
         jobUID: jobUID_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.requestData<IResult>(WebServiceKey.getProposalValidationSummary, data);
   }


   // Upload one or more QC Proposals for validation.
   async uploadProposals(authToken_: string, files_: IFileData[], jobName_: string, userEmail_: string, 
      userUID_: number): Promise<IUploadResult> {

      // Validate parameters
      if (!files_ || files_.length < 1) { throw new Error("There are no files to upload"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }
      if (!userUID_ || isNaN(userUID_)) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         files: files_,
         jobName: jobName_,
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.requestData<IUploadResult>(WebServiceKey.uploadProposals, data);
   }

}

// Create a singleton instance of _ProposalService.
export const ProposalService = new _ProposalService();