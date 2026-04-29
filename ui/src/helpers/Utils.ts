
import { AllNonNtProteinCodes, IdParameterName, IdentifierPrefix, IdentifierType, 
   LookupIdParameterType, NucleotideCodes, NucleotideAmbiguityCodes, ProteinCodes, 
   ProteinAmbiguityCodes, ProteinOnlyCodes, SequenceType } from "../global/Types";
import { IIdentifierData } from "../models/IIdentifierData";
import { Identifiers } from "../models/Identifiers";
import { SequenceMetadata } from "../models/SequenceMetadata";


export class Utils {

   static classifyFastaSequence(fastaSequence: string): SequenceMetadata {
  
      let result = new SequenceMetadata();

      // Remove whitespace and convert to uppercase for case-insensitive comparison.
      fastaSequence = fastaSequence.replace(/\s+/g, '').toUpperCase();
      if (!fastaSequence || fastaSequence.length === 0) { return result; }

      let hasProteinOnly = false;

      for (const ch of fastaSequence) {

         const isNt = NucleotideCodes.has(ch);
         const isAmbNt = NucleotideAmbiguityCodes.has(ch);
         const isProtein = ProteinCodes.has(ch);
         const isProteinAmb = ProteinAmbiguityCodes.has(ch);
         const isNonNtProtein = AllNonNtProteinCodes.has(ch)

         if (ProteinOnlyCodes.has(ch)) {
            hasProteinOnly = true;
         }

         if (isNt) result.counts.nt.standard++;
         if (isAmbNt) result.counts.nt.ambiguity++;
         if (isProtein) result.counts.aa.standard++;
         if (isProteinAmb) result.counts.aa.ambiguity++;
         if (isNonNtProtein) result.counts.aa.nonNT++;

         if (isNt || isAmbNt || isProtein || isProteinAmb) result.counts.total++;
      }

      if (result.counts.total < 1) {
         return result;
      }

      result.fractions.nt.all = (result.counts.nt.standard + result.counts.nt.ambiguity) / result.counts.total;
      result.fractions.nt.standard = result.counts.nt.standard / result.counts.total;

      result.fractions.aa.all = (result.counts.aa.standard + result.counts.aa.ambiguity) / result.counts.total;
      result.fractions.aa.nonNT = result.counts.aa.nonNT / result.counts.total;
      result.fractions.aa.standard = result.counts.aa.standard / result.counts.total;

      // Determine the sequence type
      if (hasProteinOnly) {
         result.type = SequenceType.protein;
         result.confidence = 1.0;

      } else if (result.fractions.nt.standard >= 0.95) {
         result.type = SequenceType.nucleotide;
         result.confidence = result.fractions.nt.standard;

      } else if (result.fractions.aa.standard >= 0.95) {
         result.type = SequenceType.protein;
         result.confidence = result.fractions.aa.standard;

      } else if (result.fractions.nt.all >= 0.95 && result.fractions.nt.all > result.fractions.aa.all) {
         result.type = SequenceType.nucleotide;
         result.confidence = result.fractions.nt.all;

      } else if (result.fractions.aa.all >= 0.95 && result.fractions.aa.all > result.fractions.nt.all) {
         result.type = SequenceType.protein;
         result.confidence = result.fractions.aa.all;

      } else {
         result.type = SequenceType.ambiguous;
         result.confidence = Math.abs(result.fractions.aa.all - result.fractions.nt.all);
      }

      return result;
   }


   // Convert a string containing an integer to an integer.
   static convertStringToInt(strInt_: string): number {

      const strValue = Utils.safeTrim(strInt_);
      if (strValue.length < 1) { return NaN; }

      return parseInt(strValue);
   }

   
   // Convert a numeric tree ID to a release year.
   static convertTreeIdToYear(treeID_: number): string {

      if (!treeID_) { return ""; }

      const strTreeID = `${treeID_}`;
      let year = strTreeID.substring(0, 4);
      if (strTreeID.charAt(4) !== "0") { year += "b"; }

      return year;
   }


   // Create a link to GenBank using one or more accessions. If a text parameter was provided, use it as the link text instead of the accession(s).
   static createGenBankAccessionLink(accessions_: string, text_?: string) {

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

      let displayText = Utils.safeTrim(text_);
      if (displayText.length < 1) { displayText = linkText; }

      return `<a href=\"https://www.ncbi.nlm.nih.gov/nuccore/${accessionList}\" target=\"_blank\">${displayText}</a>`;
   }

   // Format a number of bytes as Bytes, KB, MB, etc.
   static formatBytes(bytes_: number, decimals_?: number): string {
   
      if (!bytes_ || bytes_ < 0) return '0 Bytes';
    
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const index = Math.floor(Math.log(bytes_) / Math.log(1024));

      decimals_ = isNaN(decimals_) || decimals_ < 0 || index === 0 ? 0 : decimals_;

      const formattedSize = (bytes_ / Math.pow(1024, index)).toFixed(decimals_);

      return `${formattedSize} ${sizes[index]}`;
   }

   // Format a number of seconds as hours, minutes, and seconds.
   static formatSeconds(seconds_: number): string {

      let result = "";

      const hours = Math.floor(seconds_ / 3600);
      const minutes = Math.floor((seconds_ % 3600) / 60);
      const seconds = seconds_ % 60;

      if (hours === 1) {
         result += `1 hour`;
      } else if (hours > 1) {
         result += `${hours} hours`;
      }

      if (minutes > 0) {

         if (result.length > 0) { result += ", "; }

         if (minutes === 1) {
            result += `1 minute`;
         } else {
            result += `${minutes} minutes`;
         }
      }

      if (seconds > 0) {
         
         if (result.length > 0) { result += ", "; }

         //result += `${seconds} second(s)`;
         
         if (seconds === 1) {
            result += `1 second`;
         } else {
            result += `${seconds} seconds`;
         }
      }

      return result;
   }

   // Get the window's base URL: The protocol, host name, and port (optional) without subdirectories, page names, or query parameters.
   static getBaseURL(): string {

      let url = `${window.location.protocol}//${window.location.host}`;
      const qIndex = url.indexOf("?");
      if (qIndex > 0) { url = url.substring(0, qIndex); }

      if (url.endsWith("/")) { url = url.substring(0, url.length - 1); }

      return url;
   }

   
   // Look for URL query string parameters that represent identifiers.
   static getIdentifiersFromURL(params_: URLSearchParams) {

      let identifiers = new Identifiers();

      // Iterate over ID parameter names to find identifier values.
      Object.values(IdParameterName).forEach((name_) => {

         // Look for all possible parameter names and try to return all values for each one.
         params_.getAll(name_).forEach(value_ => {

            let value = Utils.safeTrim(value_);
            if (value.length < 1) { return; }

            // Try to determine the expected type.
            const expectedType = LookupIdParameterType(name_ as IdParameterName);

            // Process the identifier value, removing a prefix if appropriate.
            const idData = Utils.processIdentiferValue(value, expectedType);

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

   // Get offset (like jQuery .offset())
   static getOffset(el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const docEl = document.documentElement;
      const scrollLeft = window.pageXOffset || docEl.scrollLeft || 0;
      const scrollTop  = window.pageYOffset || docEl.scrollTop || 0;
      const clientLeft = docEl.clientLeft || 0;
      const clientTop  = docEl.clientTop || 0;

      return {
         top: rect.top + scrollTop - clientTop,
         left: rect.left + scrollLeft - clientLeft
      };
   }

   // Hide a visible element with an animated transition.
   static hideWithTransition(el_: HTMLElement, duration_?: number) {

      // Set a default for the optional parameter.
      if (isNaN(duration_)) { duration_ = 300; }

      el_.style.height = `${el_.scrollHeight}px`;
      el_.style.overflow = "hidden";
      el_.style.transitionDuration = `${duration_}ms`;

      // Force layout so the transition starts from current height.
      void el_.offsetHeight;

      // Apply the hidden end-state (matches .show-transition)
      el_.style.opacity = "0";
      el_.style.height = "0";
      el_.style.marginTop = "0";
      el_.style.marginBottom = "0";
      el_.style.paddingTop = "0";
      el_.style.paddingBottom = "0";

      const onEnd = (ev_: TransitionEvent) => {
         if (ev_.target === el_) removeStyles();
      };

      // Hide and clean up inline styles after the transition.
      const removeStyles = () => {
         el_.style.display = "none";
         el_.style.height = "";
         el_.style.overflow = "";
         el_.style.transitionDuration = "";
         el_.style.opacity = "";
         el_.style.marginTop = "";
         el_.style.marginBottom = "";
         el_.style.paddingTop = "";
         el_.style.paddingBottom = "";
         el_.removeEventListener("transitionend", onEnd);
      };

      el_.addEventListener("transitionend", onEnd);

      // A safety fallback in case "transitionend" doesn't fire.
      setTimeout(removeStyles, duration_ + 50);
   }


   // Is the user's browser on iOS?
   static isIOS() {

      // Try modern API first
      if ("userAgentData" in navigator) {
         const platform = (navigator as any).userAgentData.platform || "unknown";
         return platform === "iOS";
      } 
      
      const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera;
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document); 
      //const isMac = /Macintosh/.test(ua) && !("ontouchend" in document);

      return isIOS; // || isMac;
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
   
   // Try to determine what type of identifier was provided using an optional "expected type" (which can be inferred by the query string parameter name).
   static processIdentiferValue(id_: string, expectedType_: IdentifierType = IdentifierType.none): IIdentifierData {

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
         throw new Error("Unrecognized ID prefix");
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
   

   // If the text is empty, null, or undefined, return an empty string. Otherwise, trim
   // the text and return it.
   static safeTrim(text_: string): string {
      return !text_ ? "" : text_.trim();
   }

   // Scroll to focus on the specified element.
   static scrollToElement(el_: HTMLElement) {

      let scrollOffset = Utils.getOffset(el_);
      if (scrollOffset && scrollOffset.top) {
         
         // Clamp to document bounds
         const maxScroll = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
         ) - window.innerHeight;

         window.scrollTo({
            top: Math.max(0, Math.min(scrollOffset.top - 300, maxScroll)),
            left: 0,
            behavior: 'smooth'
         });
      }
   }

   static showWithTransition(el_: HTMLElement, duration_?: number, display_?: string) {
      
      // Set defaults for optional parameters.
      if (isNaN(duration_)) { duration_ = 300; }
      if (!display_) { display_ = "block"; }
      
      //const style = window.getComputedStyle(el_);
      // If it's already visible, don't bother.
      //if (style.display !== "none") return;

      el_.style.display = display_;

      const fullHeight = `${el_.scrollHeight}px`;

      // Set the starting "collapsed" state
      el_.classList.add("show-transition");

      el_.style.transitionDuration = `${duration_ }ms`;

      // force reflow
      void el_.offsetHeight;

      // Expand to the full size.
      el_.style.opacity = "1";
      el_.style.height = fullHeight;
      el_.style.marginTop = "";
      el_.style.marginBottom = "";
      el_.style.paddingTop = "";
      el_.style.paddingBottom = "";

      // Cleanup after the transition.
      setTimeout(() => {
         el_.classList.remove("show-transition");
         el_.style.height = "";
         el_.style.transitionDuration = "";
      }, duration_);
   }
}