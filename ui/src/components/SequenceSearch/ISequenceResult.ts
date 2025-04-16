
// The sequence-specific result within the tax_result.json file (ITaxResult).
export interface ISequenceResult {
   bitscore: string;
   blast_csv: string;
   blast_html: string;
   csv_file: string;
   evalue: string;
   html_file: string;
   input_file: string;
   qseqid: string;
   sseqid_accession: string;
   sseqid_ictvid: string;
   sseqid_lineage: {
      realm?: string;
      subrealm?: string;
      phylum?: string;
      subphylum?: string;
      class?: string;
      subclass?: string;
      order?: string;
      suborder?: string;
      family?: string;
      subfamily?: string;
      genus?: string;
      subgenus?: string;
      species: string;
   };
   sseqid_seg_name: string;
   sseqid_species_name: string;
   sseqid_type: string;
   sseqid_virus_names: string;
   sseqid_vmrid: string;
   status: string;
}