
import { IBlastHit } from "./IBlastHit";
import { BlastHSP } from "./BlastHSP";
import { SequenceType } from "../../global/Types";
import { Utils } from "../../helpers/Utils"; 


// Species isolates that correspond to E and A records.
export class BlastIsolate {

   accession: string;
   hsps: BlastHSP[];
   isolateAbbrev: string;
   isolateDesignation: string;
   isolateExemplar: string;
   isolateID: string;
   isolateName: string; 
   sequenceLength: number; // TODO: I don't think this is the correct name!
   sequenceType: SequenceType;
   

   // C-tor
   constructor(hit_: IBlastHit, sequenceType_: SequenceType) {

      if (hit_ === null) { throw new Error("Invalid BLAST hit in BlastIsolate"); }

      this.accession = null; // This should be populated below.
      this.isolateAbbrev = Utils.safeTrim(hit_.sseq_ictv.isolate_abbrev);
      this.isolateDesignation = Utils.safeTrim(hit_.sseq_ictv.isolate_designation);
      this.isolateExemplar = Utils.safeTrim(hit_.sseq_ictv.isolate_exemplar);
      this.isolateID = Utils.safeTrim(hit_.sseq_ictv.isolate_id);
      this.isolateName = Utils.safeTrim(hit_.sseq_ictv.isolate_name);
      if (!this.isolateName) { this.isolateName = "unknown"; }

      this.sequenceLength = hit_.length;
      this.sequenceType = sequenceType_;
      
      this.hsps = [];

      // Parse the sseqid for the isolate's accession.
      let parts = hit_.sseqid.split("-");
      if (Array.isArray(parts) && parts.length > 1) { 

         if (sequenceType_ === SequenceType.nucleotide) {

            // A nucleotide accession should be the last part of the sseqid.
            this.accession = parts[parts.length - 1];

         } else if (sequenceType_ === SequenceType.protein) {

            // A protein accession should be the 2nd to last part of the sseqid.
            this.accession = parts[parts.length - 2];
         }
         
      } else {
         console.error("The sseqid appears to be formatted incorrectly");
      }
   }
}