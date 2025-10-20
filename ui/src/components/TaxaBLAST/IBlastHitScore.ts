

// The BLAST hit will maintain an array of these objects. They are generated when consolidating a 
// sequence's BLAST hits from the original IBlastHit array.
export interface IBlastHitScore {
   bitscore: number;
   evalue: number;
   length: number;
   pident: number;
}