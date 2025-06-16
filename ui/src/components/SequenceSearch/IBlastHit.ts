
// A BLAST hit associated with an ISearchResult.
export interface IBlastHit {
   bitscore: number;
   evalue: number;
   input_seq: string;
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
   }
}