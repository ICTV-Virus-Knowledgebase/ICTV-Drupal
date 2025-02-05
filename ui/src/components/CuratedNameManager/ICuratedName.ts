
import { CuratedNameType, NameClass, TaxonomyDB, TaxonomyRank } from "../../global/Types";

export interface ICuratedName {
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
   type: CuratedNameType;
   uid: string;
   versionID: number;
}