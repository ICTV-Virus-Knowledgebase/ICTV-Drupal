
import { ISequenceResult } from "./ISequenceResult";

// The contents of the tax_result.json file.
export interface ITaxResult {
   input_dir: string;
   program_name: string;
   results: ISequenceResult[],
   version: string;
}