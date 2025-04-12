
import { IdParameterName, IdentifierPrefix, IdentifierType, LookupIdParameterType } from "../global/Types";
import { IIdentifierData } from "../models/IIdentifierData";


export class Utils {


   // Convert a numeric tree ID to a release year.
   static convertTreeIdToYear(treeID_: number): string {

      if (!treeID_) { return ""; }

      const strTreeID = `${treeID_}`;
      let year = strTreeID.substring(0, 4);
      if (strTreeID.charAt(4) !== "0") { year += "b"; }

      return year;
   }


   // Italicize the taxon name, if appropriate.
   static italicizeTaxonName(taxonName_: string) {

      if (!taxonName_) { return ""; }

      let lowerCaseName = taxonName_.toLowerCase();
      if (lowerCaseName.indexOf("like viruses") < 0 &&
         lowerCaseName.indexOf("unknown") < 0 &&
         lowerCaseName.indexOf("unassigned") < 0) {
         taxonName_ = `<i>${taxonName_}</i>`;
      }

      return taxonName_;
   }
   

   // TODO: Consider including a parameter for expected ID prefix.
   static processIdentifer(id_: string, expectedType_: IdentifierType = IdentifierType.none): IIdentifierData {

      if (!id_) { return null; }

      // Is the id parameter exclusively numeric?
      if (/^\d+$/.test(id_)) {
         return {
            idType: expectedType_,
            value: parseInt(id_)
         }
      }

      // Convert to uppercase for case-insensitive comparison.
      id_ = id_.toUpperCase();

      let idType: IdentifierType;
      
      if (id_.startsWith(IdentifierPrefix.ICTV)) {
         idType = IdentifierType.ICTV;
         
      } else if (id_.startsWith(IdentifierPrefix.MSL)) {
         idType = IdentifierType.MSL;

      } else if (id_.startsWith(IdentifierPrefix.taxonomy)) {
         idType = IdentifierType.taxonomy;

      } else if (id_.startsWith(IdentifierPrefix.VMR)) {
         idType = IdentifierType.VMR;

      } else {
         throw new Error("Unrecognized ID prefix");
      }

      // Remove the prefix, parse as an integer, and validate.
      const strValue = id_.replace(idType, "");
      const value = parseInt(strValue);
      if (isNaN(value)) { throw new Error("Identifier is non-numeric"); }

      return {
         idType: idType,
         value: value
      }
   }
   

   // Process URL query string parameters for ID parameters.
   static processUrlParamsForIdentifiers(params_: URLSearchParams): IIdentifierData[] {

      let results: IIdentifierData[] = [];

      // Iterate over ID parameter names until we find one. Note that the IdParameterName 
      // enum values are in order of precedence.
      Object.values(IdParameterName).forEach((name_) => {

         let testValue = Utils.safeTrim(params_.get(name_));
         if (testValue.length > 0) {

            console.log(`name: ${name_}, value: ${testValue}`)

            const expectedType = LookupIdParameterType(name_);
            const idData = Utils.processIdentifer(testValue, expectedType);
            if (idData !== null) { 
               results.push(idData); 
               
               console.log("idData = ", idData)
            }
         }
      })
      
      return results;
   }


   // If the text is empty, null, or undefined, return an empty string. Otherwise, trim
   // the text and return it.
   static safeTrim(text_: string): string {
      if (!text_) { return ""; }
      return text_.trim();
   }

}