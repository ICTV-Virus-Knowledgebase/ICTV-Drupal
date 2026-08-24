
import axios, { AxiosResponse } from "axios";
import { BlastParams } from "../components/TaxaBLAST/BlastParams";
import { IFileData } from "../models/IFileData";
import { IOutputFile } from "../components/TaxaBLAST/IOutputFile";
import { ITaxaBlastJob } from "../components/TaxaBLAST/ITaxaBlastJob";
import { ISubmissionResult } from "../components/TaxaBLAST/ISubmissionResult";
import { Utils } from "../helpers/Utils";
import { WebService } from "./WebService";
import { SequenceType, WebServiceKey } from "../global/Types";


export class _TaxaBlastService {

   
   /* This might be used in the future...
   // Download a binary (zip) file from a TaxaBLAST job.
   async downloadFile(filename_: string, jobUID_: string, userUID_: string): Promise<any> {

      if (!filename_) { throw new Error("The filename parameter is invalid"); }
      if (!jobUID_) { throw new Error("Invalid job UID"); }

      const data = {
         filename: filename_,
         jobUID: jobUID_,
         userUID: userUID_
      };

      // Get and return the result files.
      return await WebService.requestData<any>(WebServiceKey.downloadTaxaBlastFile, data);
   }*/


   // Call the NCBI Entrez EFetch web service to retrive FASTA for one or more accessions.
   async eFetch(accessions_: string, sequenceType_: SequenceType): Promise<string> {

      accessions_ = Utils.safeTrim(accessions_);
      if (accessions_.length < 1) { throw new Error("Please provide one or more accession"); }

      let db = sequenceType_ === SequenceType.nucleotide ? "nuccore" : "protein";
      const email = "info@ictv.global";
      const tool = "ICTV.TaxaBLAST";

      let uri = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=${db}&id=${accessions_}&rettype=fasta&retmode=text&tool=${tool}&email=${email}`;

      // Call the web service and wait for a response.
      let response: AxiosResponse = await axios.get(uri);

      // Validate the Axios response.
      if (!response || !response.data) { throw new Error("Invalid HTTP Response from Entrez EFetch"); }

      return response.data as string;
   }

   // Get the specified job and result metadata.
   async getJob(jobUID_: string): Promise<ITaxaBlastJob> {
      
      // Validate the parameter(s)
      if (!jobUID_) { throw new Error("Invalid job UID"); }

      const data = {
         jobUID: jobUID_
      };

      // Get and return the sequence search result.
      return await WebService.requestData<ITaxaBlastJob>(WebServiceKey.getTaxaBlastJob, data);
   }


   // Search the user's TaxaBLAST jobs.
   async searchJobs(searchText_: string, userUID_: string): Promise<ITaxaBlastJob[]> {
      
      // Validate the parameter(s)
      if (!userUID_) { throw new Error("Invalid user UID"); }

      const data = {
         searchText: searchText_,
         userUID: userUID_
      };

      return await WebService.requestData<ITaxaBlastJob[]>(WebServiceKey.searchTaxaBlastJobs, data);
   }


   // Get an output file from a TaxaBLAST job.
   async getOutputFile(filename_: string, jobUID_: string, userUID_: string): Promise<IOutputFile> {

      if (!filename_) { throw new Error("The filename parameter is invalid"); }
      if (!jobUID_) { throw new Error("Invalid job UID"); }
      if (!userUID_) { throw new Error("Invalid user UID"); }

      const data = {
         filename: filename_,
         jobUID: jobUID_,
         userUID: userUID_
      };

      // Get and return the result files.
      return await WebService.requestData<IOutputFile>(WebServiceKey.getTaxaBlastOutputFile, data);
   }

   
   // Upload one or more sequences for processing.
   async uploadSequences(blastParams_: BlastParams, files_: IFileData[], jobName_: string, userEmail_: string, 
      userUID_: string): Promise<ISubmissionResult> {

      // Validate parameters
      if (!files_ || files_.length < 1) { throw new Error("There are no files to upload"); }
      if (!userEmail_) { throw new Error("The user email parameter is invalid"); }
      if (!userUID_) { throw new Error("The user UID parameter is invalid"); }

      const data = {
         files: files_,
         jobName: jobName_,
         maxHSPS: blastParams_.maxHSPS,
         maxTargetSeqs: blastParams_.maxTargetSeqs,
         task: blastParams_.task as string,
         userEmail: userEmail_,
         userUID: userUID_
      };

      return await WebService.requestData<ISubmissionResult>(WebServiceKey.uploadSequences, data);
   } 

}

// Create a singleton instance of _TaxaBlastService.
export const TaxaBlastService = new _TaxaBlastService();