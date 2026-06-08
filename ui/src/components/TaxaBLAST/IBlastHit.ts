
import { BlastHSP } from "./BlastHSP";

// A BLAST hit associated with an ISearchResult.
export interface IBlastHit {

   bitscore: number;
   evalue: number;
   length: number;
   pident: number;
   ppos: number;

   // Query
   qseqid: string;
   qstart: number;
   qend: number;
   
   // Subject
   sseqid: string;
   sstart: number;
   send: number;
   sseq_ictv: {

      // CDS
      cds_note: string;
      cds_protein_id: string;
      cds_product_name: string;
      
      // Segment
      segment_accession: string;
      segment_name: string;
      segment_start_loc: number;
      segment_end_loc: number;

      // Isolate
      isolate_abbrev: string;
      isolate_designation: string;
      isolate_exemplar: string; // A or E
      isolate_id: string;
      isolate_name: string;

      // Lineage/species
      species_ictv_id: string;
      lineage: {
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
      }
   }
}