
import { BlastHSP } from "./BlastHSP";

// A BLAST hit associated with an ISearchResult.
export interface IBlastHit {
   bitscore: number;
   end_loc: number;
   evalue: number;
   exemplar_additional: string;
   hsps: BlastHSP[];         // Note: This is populated by the BLAST hits panel.
   ictv_id: string;
   input_seq: string;
   isolate_id: string;
   length: number;
   Note: string;
   pident: number;
   Protein_id: string;
   Product_name: string;
   qseqid: string;
   segmentname: string;
   sseqid: string;
   sseqid_accession: string;
   sseqid_lineage: {
      realm: string;
      subrealm: string;
      kingdom: string;
      subkingdom: string;
      phylum: string;
      subphylum: string;
      class: string;
      subclass: string;
      order: string;
      suborder: string;
      family: string;
      subfamily: string;
      genus: string;
      subgenus: string;
      species: string;
   };
   start_loc: number;
   virus_names: string;
}