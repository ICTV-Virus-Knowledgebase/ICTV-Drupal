
import { ISearchResult } from "./ISearchResult";

// The contents of the tax_result.json file.
export interface ITaxResult {
   database_name: string;
   database_title: string;
   errors: string;
   input_dir: string;
   program_name: string;
   results: ISearchResult[];
   version: string;
}