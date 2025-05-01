

export interface IMslRelease {

    notes: string;

    releaseNumber: string;

    treeID: number;

    year: string;

    // Counts by rank
    realms: number;
    subrealms: number;
    kingdoms: number;
    subkingdoms: number;
    phyla: number;
    subphyla: number;
    classes: number;
    subclasses: number;
    orders: number;
    suborders: number;
    families: number;
    subfamilies: number;
    genera: number;
    subgenera: number;
    species: number;
}
