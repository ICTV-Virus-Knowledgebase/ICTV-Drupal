

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
   
   
   // If the text is empty, null, or undefined, return an empty string. Otherwise, trim
   // the text and return it.
   static safeTrim(text_: string): string {
      if (!text_) { return ""; }
      return text_.trim();
   }

}