
import { ISequenceResult } from "./ISequenceResult";

// Result data from the sequence classifier.
export interface IClassifierResult {
   program_name: string;
   version: string;
   input_dir: string;
   results: ISequenceResult[];
   
   /*
   These attributes were included in the proposal service's validation result:
   
   command: string;
   errors: number;
   info: number;
   result: string;
   status: string;
   stdError: string;
   successes: number;
   summary: string;
   warnings: number;
   */
}