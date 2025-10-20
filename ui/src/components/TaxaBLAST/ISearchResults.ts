
import { ISequenceFile } from "./ISequenceFile";

// The TaxaBLAST result (the contents of the tax_result.json file).
export interface ISearchResults {
   database_name: string;
   database_title: string;
   errors: string[];
   files: ISequenceFile[];
   input_dir: string;
   program_name: string;
   version: string;
}