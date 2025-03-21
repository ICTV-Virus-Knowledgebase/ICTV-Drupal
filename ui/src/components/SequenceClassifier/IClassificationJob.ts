
import { ITaxResult } from "./ITaxResult";
import { JobStatus } from "../../global/Types";


export interface IClassificationJob {
   jobName: string;
   jobUID: string;
   output: {
      program_name: string,
      version: string,
      input_dir: string,
      results: ITaxResult[]
   };
   status: JobStatus
}