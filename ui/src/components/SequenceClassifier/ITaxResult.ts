

export interface ITaxResult {
   input_file: string;
   input_seq: string;
   status: string;
   classification_rank: string;
   classification_lineage: {
      realm?: string,
      family?: string,
      genus?: string,
      species?: string
   }
   blast_htmls: {
      blast_results: string
   }
}