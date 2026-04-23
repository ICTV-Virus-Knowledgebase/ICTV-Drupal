
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

   // The viral segment (if appropriate).
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
   constructor(hit_: IBlastHit) {

      this.isolates = new Map<string, BlastIsolate>();

      this.ictvID = Utils.safeTrim(hit_.ictv_id);
      if (!this.ictvID) { 
         throw new Error("Invalid ICTV ID in BlastSpecies"); 
      }
      
      this.exemplarIsolateID = null;
      this.filename = Utils.safeTrim(hit_.input_seq);
      this.segmentName = Utils.safeTrim(hit_.segmentname);

      if (hit_.sseqid_lineage === null) { 
         throw new Error("The sseqid_lineage is invalid in BlastSpecies"); 
      }
      
      // Lineage
      this.realm = Utils.safeTrim(hit_.sseqid_lineage.realm);
      this.subrealm = Utils.safeTrim(hit_.sseqid_lineage.subrealm);
      this.kingdom = Utils.safeTrim(hit_.sseqid_lineage.kingdom);
      this.subkingdom = Utils.safeTrim(hit_.sseqid_lineage.subkingdom);
      this.phylum = Utils.safeTrim(hit_.sseqid_lineage.phylum);
      this.subphylum = Utils.safeTrim(hit_.sseqid_lineage.subphylum);
      this.class = Utils.safeTrim(hit_.sseqid_lineage.class);
      this.subclass = Utils.safeTrim(hit_.sseqid_lineage.subclass);
      this.order = Utils.safeTrim(hit_.sseqid_lineage.order);
      this.suborder = Utils.safeTrim(hit_.sseqid_lineage.suborder);
      this.family = Utils.safeTrim(hit_.sseqid_lineage.family);
      this.subfamily = Utils.safeTrim(hit_.sseqid_lineage.subfamily);
      this.genus = Utils.safeTrim(hit_.sseqid_lineage.genus);
      this.subgenus = Utils.safeTrim(hit_.sseqid_lineage.subgenus);
      this.species = Utils.safeTrim(hit_.sseqid_lineage.species);
   }
   
}