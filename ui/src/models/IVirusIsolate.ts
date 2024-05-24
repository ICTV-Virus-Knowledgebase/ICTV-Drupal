
export interface IVirusIsolate {
   abbrev: string;
   accessionNumber: string;
   alternativeNameCSV: string;
   availableSequence: string;
   exemplar: string;
   isolate: string;
   refSeqAccession: string;
   taxNodeID: string;

   // Lineage names
   subrealm: string;
   kingdom: string;
   subkingdom: string;
   phylum: string;
   subphylum: string;
   order: string;
   suborder: string;
   class_: string;   // "Class" is a reserved word here and on the server side.
   subclass: string;
   family: string;
   subfamily: string;
   genus: string;
   subgenus: string;
   species: string;
}