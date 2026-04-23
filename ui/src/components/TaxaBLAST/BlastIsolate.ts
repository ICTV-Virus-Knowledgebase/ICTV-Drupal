
import { IBlastHit } from "./IBlastHit";
import { BlastHSP } from "./BlastHSP";
import { SequenceType } from "../../global/Types";
import { Utils } from "../../helpers/Utils"; 


// Species isolates that correspond to E and A records.
export class BlastIsolate {

   accession: string;
   exemplarOrAdditional: string;
   hsps: BlastHSP[];
   isolateID: string;
   sequenceLength: number;
   sequenceType: SequenceType;
   virusNames: string; // TODO: why is this plural? Can there be multiple names for an isolate?

   // C-tor
   constructor(hit_: IBlastHit, sequenceType_: SequenceType) {

      if (hit_ === null) { throw new Error("Invalid BLAST hit in BlastIsolate"); }

      this.accession = null; // This should be populated below.
      this.exemplarOrAdditional = Utils.safeTrim(hit_.exemplar_additional);
      this.hsps = [];
      this.isolateID = hit_.isolate_id;
      this.sequenceLength = hit_.length;
      this.sequenceType = sequenceType_;
      this.virusNames = hit_.virus_names;
      if (!this.virusNames) { this.virusNames = "unknown"; }

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