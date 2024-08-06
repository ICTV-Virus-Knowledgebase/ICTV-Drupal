

export interface ISequenceResult {
   classification_lineage: {
      realm?: string;
      family?: string;
      genus?: string;
      species?: string;
   }
   classification_rank: string;
   error?: string;
   input_seq: string;
   message?: string;
   status: string;
}


/*
{
   "input_seq": "test_seq_1",
   "status": "CLASSIFIED",
   "classification_rank": "species",
   "classification_lineage": {
      "realm": "HelloRealm",
      "family": "BigFamily",
      "genus": "WorldGenus",
      "species": "WorldGenus specius"
   }
},
{
   "input_seq": "test_seq_2",
   "status": "CLASSIFIED",
   "classification_rank": "genus",
   "classification_lineage": {
      "realm": "HelloRealm",
      "family": "BigFamily",
      "genus": "CountryGenus"
   },
   "message": "Homologous to species within the genus, but not close enough to classify within an existing species"
},
{
   "input_seq": "test_seq_3",
   "status": "FAILED",
   "error": "Sequence did not have 0.5% or more of it's sequence homologous to a reference species"
}
*/