
// The object returned by taxonomy searches
export interface ITaxonSearchResult {
    ictvID: number;
    jsonID: number;
    jsonLineage: string;
    lineage: string;
    lineageHTML: string;
    name: string;
    rankName: string;
    releaseNumber: number;
    searchText: string;
    taxnodeID: number;
    treeID: number;
    treeName: string;
}