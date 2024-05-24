
// Data attributes for a taxa node.
export interface ITaxon {
    childTaxaCount: string;
    filename: string;
    immediateChildTaxaCount: string;
    isReference: boolean;
    levelID: number;
    levelName: string;
    memberOf: string;
    nextDeltaCount: number;
    nodeDepth: number;
    numChildren: number;
    parentID: string;
    parentLevelName?: string;
    prevDeltaCount: number;
    taxnodeID: string;
    taxonName: string;
    treeID: string;
}