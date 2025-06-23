

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
   isSelected: boolean;
   isSplit: boolean;
   lineageIDs: string;
   lineageNames: string;
   lineageRanks: string;
   mslReleaseNum: number;
   name: string;
   prevLineageNames: string;
   prevLineageRanks: string;
   prevNames: string;
   prevNotes: string;
   prevProposal: string;
   rankName: string;
   taxnodeID: number;
   treeID: number;

   //------------------------------------------------------------------------------------------------------
   // The following properties are added after the JSON is returned by the web service.
   //------------------------------------------------------------------------------------------------------
   formattedLineage?: string;

   // Split the semicolon-delimited strings into arrays for easier processing.
   lineageIDArray?: string[];
   lineageNameArray?: string[];
   lineageRankArray?: string[];
   prevLineageNameArray?: string[];
   prevLineageRankArray?: string[];
   prevNameArray?: string[];

   previousParent?: {
      name: string;
      rank: string;
   };
   previousRank?: string;
}