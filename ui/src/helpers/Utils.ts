
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


   // Create a link to GenBank using one or more accessions.
   static createGenBankAccessionLink(accessions_: string) {

      if (!accessions_) { return ""; }

      accessions_ = accessions_.trim();
      if (accessions_.length < 1) { return ""; }

      // If commas were used as a delimiter, replace them with semicolons.
      accessions_ = accessions_.replace(",", ";");

      let accessionCount = 0;
      let accessionList = "";
      let linkText = "";

      // Tokenize using a semicolon as the delimiter. If there aren't any semicolons, the input text will be the only token.
      const tokens = accessions_.split(";");
      if (Array.isArray(tokens) && tokens.length > 0) {

         tokens.forEach((token_: string) => {

            if (!token_) { return; }

            let trimmedToken = token_.trim();
            if (trimmedToken.length < 1) { return; }

            let accession = null;

            // Get the accession from the token.
            let colonIndex = trimmedToken.indexOf(":");
            if (colonIndex > 0) {
               accession = trimmedToken.substring(colonIndex + 1);
               accession = accession.trim();
               if (accession.length < 1) { return; }
            } else {
               accession = trimmedToken;
            }

            if (accessionCount > 0) {

               // Add a semicolon and line break before all but the first link.
               linkText += "; ";

               // Add a comma before all but the first accession number.
               accessionList += ","
            }

            // Add the token to the link text.
            linkText += trimmedToken;

            // Add the accession number to the comma-delimited list.
            accessionList += accession;

            // Increment the accession count.
            accessionCount += 1;
         })
      }

      if (accessionList.length < 1 || linkText.length < 1) { return ""; }

      return `<a href=\"https://www.ncbi.nlm.nih.gov/nuccore/${accessionList}\" target=\"_blank\">${linkText}</a>`;
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