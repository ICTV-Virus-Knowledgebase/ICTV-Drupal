

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
   lineageRanks: string;
   mslReleaseNumber: number;
   name: string;
   previousLineage: string;
   previousNames: string;
   prevNotes: string;
   prevProposal: string;
   rankName?: string;
   taxnodeID: number;
   treeID: number;
   year?: string;

   // The following properties are added after the JSON is returned by the web service.
   formattedLineage?: string;
   previousParent?: {
      name: string;
      rank: string;
   };
   previousRank?: string;
}