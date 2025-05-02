

// A collection of identifiers that is return by Utils.getIdentifiersFromURL.
export class Identifiers {

   ictvID: number;
   msl: number;
   taxNodeID: number;
   taxonName: string;
   vmrID: number;

   // C-tor
   constructor() {
      this.ictvID = NaN;
      this.msl = NaN;
      this.taxNodeID = NaN;
      this.taxonName = null;
      this.vmrID = NaN;
   }

   // Is the identifiers instance valid?
   public static isValid(ids_: Identifiers): boolean {

      if (!ids_) { return false; }

      if (isNaN(ids_.ictvID) && isNaN(ids_.msl) && isNaN(ids_.taxNodeID) && !ids_.taxonName && isNaN(ids_.vmrID)) {
         return false;
      } else {
         return true;
      }
   }
}