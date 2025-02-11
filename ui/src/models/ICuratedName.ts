
import { CuratedNameType, TaxonomyRank } from "../global/Types";

export interface ICuratedName {
   comments: string;
   createdBy?: string;
   createdOn?: string;
   ictvTaxnodeID: number;
   isValid?: boolean;
   name: string;
   rankName?: TaxonomyRank;
   taxonName?: string;
   type: CuratedNameType;
   uid?: string;
   versionID?: number;

   
   /*
   The original version: 

   comments: string;
   createdBy: string;
   createdOn: string;
   division: string;
   ictvID: number;
   ictvTaxnodeID: number;
   id: number;
   isValid: boolean;
   name: string;
   nameClass: NameClass;
   rankName: TaxonomyRank;
   taxonomyDB: TaxonomyDB;
   taxonomyID: number;
   taxonName: string;
   type: CuratedNameType;
   uid: string;
   versionID: number;*/
}