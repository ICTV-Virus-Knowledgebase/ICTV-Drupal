
import { IdentifierPrefix, IdentifierType, IdParameterName, IsEnumValue } from "../global/Types";
import { IIdentifierData } from "./IIdentifierData";
import { Utils } from "../helpers/Utils";


// A collection of identifiers that is return by getIdentifiersFromURL.
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

   // Look for URL query string parameters that represent identifiers.
   public static getIdentifiersFromURL(): Identifiers {

      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);

      // Create a new Identifiers instance.
      let identifiers = new Identifiers();

      // Iterate over ID parameter names to find identifier values.
      Object.values(IdParameterName).forEach((name_) => {

         // Look for all possible parameter names and try to return all values for each one.
         urlParams.getAll(name_).forEach(value_ => {

            let value = Utils.safeTrim(value_);
            if (value.length < 1) { return; }

            // Try to determine the expected type.
            const expectedType = Identifiers.lookupIdParameterType(name_ as IdParameterName);

            // Process the identifier value, removing a prefix if appropriate.
            const idData = Identifiers.processIdentifierValue(value, expectedType);
            if (!idData) { return; }

            switch (idData.idType) {

               case IdentifierType.ICTV:
                  identifiers.ictvID = idData.value as number;
                  break;

               case IdentifierType.MSL:
                  identifiers.msl = idData.value as number;
                  break;

               case IdentifierType.TaxNodeID:
                  identifiers.taxNodeID = idData.value as number;
                  break;

               case IdentifierType.TaxonName:
                  identifiers.taxonName = idData.value as string;
                  break;

               case IdentifierType.VMR:
                  identifiers.vmrID = idData.value as number;
                  break;
               
               default: 
                  return;
            }
         })
      })

      return identifiers;
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

   public static lookupIdParameterType(parameterName_: IdParameterName|string): IdentifierType {

      if (!parameterName_) { return IdentifierType.none; }
      if (!IsEnumValue(IdParameterName, parameterName_)) { return IdentifierType.none; }

      switch (parameterName_) {

         // ICTV ID
         case IdParameterName.ictv:
         case IdParameterName.ictv_id:
            return IdentifierType.ICTV;
         
         // ID
         case IdParameterName.id:
            return IdentifierType.none;

         // MSL ID
         case IdParameterName.msl:
         //case IdParameterName.msl_id:
            return IdentifierType.MSL;

         // Taxnode ID
         case IdParameterName.taxnode_id:
         case IdParameterName.tn:
         case IdParameterName.tn_id:
            return IdentifierType.TaxNodeID;

         // Taxon name
         case IdParameterName.taxon_name:
            return IdentifierType.TaxonName;

         // VMR ID
         case IdParameterName.vmr:
         case IdParameterName.vmr_id:
            return IdentifierType.VMR;

         default:
            return IdentifierType.none;
      }
   }

   // Try to determine what type of identifier was provided using an optional "expected type" (which can be inferred by the query string parameter name).
   public static processIdentifierValue(id_: string, expectedType_: IdentifierType = IdentifierType.none): IIdentifierData {

      if (!id_) { return null; }

      // Is the id parameter entirely numeric?
      if (/^\d+$/.test(id_)) {
         return {
            idType: expectedType_,
            value: parseInt(id_)
         }
      }

      // No processing needs to happen for a taxon name (string) value.
      if (expectedType_ === IdentifierType.TaxonName) {
         return {
            idType: IdentifierType.TaxonName,
            value: Utils.safeTrim(id_)
         }
      }

      // Convert to uppercase for case-insensitive comparison.
      id_ = id_.toUpperCase();

      let idPrefix: IdentifierPrefix = null;
      let idType: IdentifierType = null;
      
      if (id_.startsWith(IdentifierPrefix.ICTV)) {
         idPrefix = IdentifierPrefix.ICTV;
         idType = IdentifierType.ICTV;
         
      } else if (id_.startsWith(IdentifierPrefix.MSL)) {
         idPrefix = IdentifierPrefix.MSL;
         idType = IdentifierType.MSL;

      } else if (id_.startsWith(IdentifierPrefix.TaxNodeID)) {
         idPrefix = IdentifierPrefix.TaxNodeID;
         idType = IdentifierType.TaxNodeID;

      } else if (id_.startsWith(IdentifierPrefix.VMR)) {
         idPrefix = IdentifierPrefix.VMR;
         idType = IdentifierType.VMR;

      } else {
         return null;
         //throw new Error("Unrecognized ID prefix");
      }

      // Remove the prefix, parse as an integer, and validate.
      const strValue = id_.replace(idPrefix, "");
      const value = parseInt(strValue);
      if (isNaN(value)) { throw new Error("Identifier is non-numeric"); }

      return {
         idType: idType,
         value: value
      }
   }

   // Reset the identifiers
   public reset() {
      this.ictvID = NaN;
      this.msl = NaN;
      this.taxNodeID = NaN;
      this.taxonName = null;
      this.vmrID = NaN;
   }
}