
import { ISequenceFile } from "./ISequenceFile";

// The TaxaBLAST result (the contents of the tax_result.json file).
export interface ISearchResults {
   blastasn_cmd: string; // "blastn -task blastn -evalue 0.05 -word_size 11 -reward 2 -penalty -3 -gapopen 5 -gapextend 2 -dust yes -soft_masking true -max_target_seqs 50 -max_hsps 25 -db .\/blast\/ICTV_VMR_b -outfmt 11"
   database_name: string;
   database_title: string;
   errors: string[];
   files: ISequenceFile[];
   input_dir: string;
   max_hsps: number;
   max_target_seqs: number;
   program_name: string;
   task: string;   
   version: string;
}