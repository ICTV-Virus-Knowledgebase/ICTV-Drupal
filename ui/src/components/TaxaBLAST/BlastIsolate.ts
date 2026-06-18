
import { IBlastHit } from "./IBlastHit";
import { BlastHSP } from "./BlastHSP";
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
   sequenceLength: number; // TODO: Which sequence is it referring to?
   

   // C-tor
   constructor(hit_: IBlastHit) {

      if (hit_ === null) { throw new Error("Invalid BLAST hit in BlastIsolate"); }

      this.accession = Utils.safeTrim(hit_.sseq_ictv.segment_accession);
      this.isolateAbbrev = Utils.safeTrim(hit_.sseq_ictv.isolate_abbrev);
      this.isolateDesignation = Utils.safeTrim(hit_.sseq_ictv.isolate_designation);
      this.isolateExemplar = Utils.safeTrim(hit_.sseq_ictv.isolate_exemplar);
      this.isolateID = Utils.safeTrim(hit_.sseq_ictv.isolate_id);
      this.isolateName = Utils.safeTrim(hit_.sseq_ictv.isolate_name);
      if (!this.isolateName) { this.isolateName = "unknown"; }

      this.sequenceLength = hit_.length;
      
      this.hsps = [];

      /*
      // Parse the sseqid for the isolate's accession. In the example sseqid "Whispovirus_xiabaidian--KT995472.1-ALN66444.1" 
      // the isolate accession is "KT995472.1".
      const regex = /--([^-]+)(?:-.*)?$/;
      const match = hit_.sseqid.match(regex);
      if (match !== null) { 
         this.accession = match?.[1]; 
      }*/
   }
}