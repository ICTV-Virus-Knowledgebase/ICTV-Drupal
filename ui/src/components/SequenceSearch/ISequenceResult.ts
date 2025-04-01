
// The sequence-specific result within the tax_result.json file (ITaxResult).
export interface ISequenceResult {
   blast_csv: string;
   blast_html: string;
   classification_lineage: {
      realm?: string;
      family?: string;
      genus?: string;
      species?: string;
   };
   classification_rank: string;
   csv_file: string;
   html_file: string;
   input_file: string;
   input_seq: string;
   message?: string;
   status: string;
}
