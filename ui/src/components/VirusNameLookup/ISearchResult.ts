


export interface ISearchResult {

   // How many characters were different between the search text and match?
   countDifferences: number;

   // The NCBI division (phages, viruses)
   division: string;
         
   // Prefer virus and phage results over anything else.
   divisionScore: number;

   // Were the first characters of the search text and match the same?
   firstCharacterMatch: number;

   // Prefer results that have an ICTV taxnode ID.
   hasTaxnodeID: number;

   ictvTaxnodeID: number;

   // Is this an exact match?
   isExactMatch: number;

   // Is this a valid taxon (not obsolete)?
   isValid: number;

   // How much did the search text's length differ from the match's length?
   lengthDifference: number;

   // The matching name
   name: string;

   // The name class/type, inspired by NCBI name class.
   nameClass: string;
   nameClassScore: number;

   // The number of matching ordered string pairs from the search text.
   orderedPairCount: number;

   parentTaxonomyDB: string;
   parentTaxonomyID: number;

   rankName: string;

   // Ranks found in ICTV, VMR, and NCBI Taxonomy (virus and phage divisions only).
   // Prefer lower ranks over higher ranks.
   rankScore: number;

   // The overall score.
   score: number;
   
   taxonomyDB: string;

   // Taxonomy databases in order of preference.
   taxonomyDbScore: number;

   taxonomyID: number;
   versionID: number;
   
}