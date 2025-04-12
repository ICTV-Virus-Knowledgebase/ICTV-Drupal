

export interface ITaxon {
   ictvID: number;
   isDeleted: boolean;
   isDemoted: boolean;
   isLineageUpdated: boolean;
   isMerged: boolean;
   isMoved: boolean;
   isNew: boolean;
   isPromoted: boolean;
   isRenamed: boolean;
   isSplit: boolean;
   lineage: string;
   lineageIDs: string;
   mslReleaseNumber: number;
   name: string;
   previousNames: string;
   prevNotes: string;
   prevProposal: string;
   rankNames: string;
   taxnodeID: number;
   treeID: number;
}