
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

   queryStart: number|null;
   queryEnd: number|null;
   hitStart: number|null;
   hitEnd: number|null;

   // The subject sequence ID
   sseqid: string;

   // The subject sequence's accession.
   sseqidAccession: string;
   
   startLocation: number;

   // C-tor
   constructor(hit_: IBlastHit) {

      if (hit_ === null) { throw new Error("Invalid BLAST hit in BlastHSP"); }

      this.bitscore = hit_.bitscore;
      this.endLocation = hit_.send; // hit_.end_loc;
      this.evalue = hit_.evalue;
      this.hitEnd = hit_.send;
      this.hitStart = hit_.sstart; 
      this.length = hit_.length;
      this.note = Utils.safeTrim(hit_.sseq_ictv.cds_note);
      this.pident = hit_.pident;
      this.proteinID = Utils.safeTrim(hit_.sseq_ictv.cds_protein_id);
      this.productName = Utils.safeTrim(hit_.sseq_ictv.cds_product_name);
      this.queryEnd = hit_.qend;
      this.queryStart = hit_.qstart;
      this.sseqid = hit_.sseqid;
      //this.sseqidAccession = hit_.ss // hit_.sseqid_accession;
      this.startLocation = hit_.sstart; // hit_.start_loc;
   }
}