
import { IBlastHit } from "./IBlastHit";
import { Utils } from "../../helpers/Utils"; 


// A high-scoring pair from BLAST results. These are populated when consolidating a 
// sequence's BLAST hits from the original IBlastHit array.
export class BlastHSP {

   bitscore: number;
   endLocation: number;
   evalue: number;
   length: number;
   note: string;
   pident: number;
   proteinID: string;
   productName: string;

   // The subject sequence ID
   sseqid: string;

   // The subject sequence's accession.
   sseqidAccession: string;
   
   startLocation: number;

   // C-tor
   constructor(hit_: IBlastHit) {

      if (hit_ === null) { throw new Error("Invalid BLAST hit in BlastHSP"); }

      this.bitscore = hit_.bitscore;
      this.endLocation = hit_.end_loc;
      this.evalue = hit_.evalue;
      this.length = hit_.length;
      this.note = Utils.safeTrim(hit_.Note);
      this.pident = hit_.pident;
      this.proteinID = Utils.safeTrim(hit_.Protein_id);
      this.productName = Utils.safeTrim(hit_.Product_name);
      this.sseqid = hit_.sseqid;
      this.sseqidAccession = hit_.sseqid_accession;
      this.startLocation = hit_.start_loc;
   }
}