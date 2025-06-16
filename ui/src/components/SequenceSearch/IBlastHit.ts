
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
      family: string;
      subfamily: string;
      phylum: string;
      class: string;
      order: string;
      genus: string;
      species: string;
      kingdom: string;
      subkingdom: string;
      subphylum: string;
      subrealm: string;
      subclass: string;
      suborder: string;
      subgenus: string;
   }
}