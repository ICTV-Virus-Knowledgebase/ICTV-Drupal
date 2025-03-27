
// The sequence-specific result within the tax_result.json file (ITaxResult).
export interface ISequenceResult {
   blast_htmls: {
      blast_results: string;
   };
   classification_lineage: {
      realm?: string;
      family?: string;
      genus?: string;
      species?: string;
   };
   classification_rank: string;
   input_file: string;
   input_seq: string;
   message?: string;
   status: string;
}
