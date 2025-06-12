
// The result of "getTaxonHistory".
export interface ITaxonAndRelease {
   
   // Taxon
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
   leftIdx: number;
   lineage: string;
   lineageIDs: string;
   modifications: number;
   mslReleaseNum: number;
   name: string;
   previousNames: string;
   prevNotes: string;
   prevParentRank: string;
   prevParentName: string;
   prevProposal: string;
   taxnodeID: number;

   // Release
   releaseRankNames: string;
   releaseTitle: string;
   releaseYear: string;
}