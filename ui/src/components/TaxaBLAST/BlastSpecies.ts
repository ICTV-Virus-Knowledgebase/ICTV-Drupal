
import { IBlastHit } from "./IBlastHit";
import { BlastIsolate } from "./BlastIsolate";
import { Utils } from "../../helpers/Utils"; 


// A species identified by BLASTing a query sequence.
export class BlastSpecies {

   // The isolate ID of the species' exemplar virus.
   exemplarIsolateID: string;

   // The name of the file that contained the query sequence. In
   // BLAST terminology, this is the input_seq.
   filename: string;

   // ICTV ID uniquely identifies the species.
   ictvID: string;

   // Species isolates that correspond to E and A records.
   isolates: Map<string, BlastIsolate>;

   // The ID of a query sequence that was used for BLAST alignments. In
   // BLAST terminology, this is the qseqid.
   queryID: string;

   // The viral segment (if appropriate)
   segmentAccession: string;
   segmentName: string;

   // Lineage names
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


   // C-tor
   constructor(filename_: string, hit_: IBlastHit) {

      this.isolates = new Map<string, BlastIsolate>();

      this.ictvID = Utils.safeTrim(hit_.sseq_ictv.species_ictv_id);
      if (!this.ictvID) { 
         throw new Error("Invalid ICTV ID in BlastSpecies"); 
      }
      
      this.exemplarIsolateID = hit_.sseq_ictv.isolate_id;
      this.filename = Utils.safeTrim(filename_);
      this.segmentAccession = Utils.safeTrim(hit_.sseq_ictv.segment_accession);
      this.segmentName = Utils.safeTrim(hit_.sseq_ictv.segment_name);

      if (hit_.sseq_ictv.lineage === null) { 
         throw new Error("The sseq_ictv.lineage is invalid in BlastSpecies"); 
      }
      
      // Lineage
      this.realm = Utils.safeTrim(hit_.sseq_ictv.lineage.realm);
      this.subrealm = Utils.safeTrim(hit_.sseq_ictv.lineage.subrealm);
      this.kingdom = Utils.safeTrim(hit_.sseq_ictv.lineage.kingdom);
      this.subkingdom = Utils.safeTrim(hit_.sseq_ictv.lineage.subkingdom);
      this.phylum = Utils.safeTrim(hit_.sseq_ictv.lineage.phylum);
      this.subphylum = Utils.safeTrim(hit_.sseq_ictv.lineage.subphylum);
      this.class = Utils.safeTrim(hit_.sseq_ictv.lineage.class);
      this.subclass = Utils.safeTrim(hit_.sseq_ictv.lineage.subclass);
      this.order = Utils.safeTrim(hit_.sseq_ictv.lineage.order);
      this.suborder = Utils.safeTrim(hit_.sseq_ictv.lineage.suborder);
      this.family = Utils.safeTrim(hit_.sseq_ictv.lineage.family);
      this.subfamily = Utils.safeTrim(hit_.sseq_ictv.lineage.subfamily);
      this.genus = Utils.safeTrim(hit_.sseq_ictv.lineage.genus);
      this.subgenus = Utils.safeTrim(hit_.sseq_ictv.lineage.subgenus);
      this.species = Utils.safeTrim(hit_.sseq_ictv.lineage.species);
   }
   
}