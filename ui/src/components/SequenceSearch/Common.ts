
import { AppSettings } from "../../global/AppSettings";
import { DateTime } from "luxon";
import { Utils } from "../../helpers/Utils";


//----------------------------------------------------------------------------------------------------------------
// Enums
//----------------------------------------------------------------------------------------------------------------

// CSS class names for buttons.
export enum ButtonClass {
   cancel = "cancel-button",
   copyURL = "copy-url-button",
   downloadCSV = "download-csv-button",
   upload = "upload-button",
   viewHits = "view-hits",
   viewHTML = "view-html-button"
}

export enum Icon {
   browse = `<i class=\"fa fa-file\"></i>`,
   cancel = `<i class="fa-solid fa-xmark"></i>`,
   chevronDown = `<i class=\"fa fa-chevron-down expanded\"></i>`,
   chevronRight = `<i class=\"fa fa-chevron-up collapsed\"></i>`,
   close = `<i class=\"fa fa-xmark\"></i>`,
   copy = `<i class=\"fa-regular fa-clipboard\"></i>`,
   csv = `<i class="fa-regular fa-file-csv"></i>`,
   dna = `<i class="fa-solid fa-dna"></i>`,
   download = `<i class=\"fa fa-download\"></i>`,
   html = `<i class="fa-regular fa-file-lines"></i>`,
   lineageDelimiter = `<i class="fa-solid fa-chevron-right"></i>`,
   spinner = `<i class="fa fa-spinner fa-spin spinner-icon"></i>`,
   upload = `<i class=\"fa fa-upload\"></i>`
}

export enum PanelAction {
   displayJob = "displayJob",
   displayBlastHits = "displayBlastHits",
   //displaySearchResults = "displaySearchResults",
   displayUpload = "displayUpload"
}

export enum PanelKey {
   blastHits = "blastHits",
   jobDetails = "jobDetails",
   searchResults = "searchResults",
   upload = "upload"
}

export enum ParameterKey {
   file = "file",
   filename = "filename",
   job = "job",
   sequence = "sequence",
   userUID = "userUID"
}

export enum ResultFileType {
   asn = "asn",
   csv = "csv",
   fasta = "fasta",
   html = "html",
   stderr = "stderr",
   stdout = "stdout"
}


//----------------------------------------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------------------------------------
export const Constants = {

   // Accepted file types for sequence uploads.
   ACCEPTED_FILE_TYPES: [".fa", ".faa", ".fas", ".fasta", ".ffn", ".fna", ".frn", ".mpfa", ".txt"],

   // Date and time format strings.
   DATE_FORMAT: {
      FROM: "yyyy-MM-dd HH:mm:ss",
      TO_DATE: "cccc, LLLL d, y",
      TO_TIME: "h:mm:ss a"
   },

   // The maximum number of sequences that can be uploaded.
   MAX_SEQUENCE_COUNT: 64,

   NO_EMAIL: "NO_EMAIL"
}


//----------------------------------------------------------------------------------------------------------------
// Functions
//----------------------------------------------------------------------------------------------------------------

// Return a lowercase version of the name and replace whitespace with underscores.
export function CreateKeyFromName(name_: string): string {
   return name_.toLowerCase().replace(/\W+/g, '_');
}

// Create a URL for the ICTV taxon details page.
export function CreateTaxonDetailsURL(ictvID_: string, name_: string) {
   const url = AppSettings.taxonHistoryPage;
   return `${url}?ictv_id=${ictvID_}&taxon_name=${name_}`;
}

// Format a date string using the date and time format strings.
export function FormatDate(date_: string) {

   date_ = Utils.safeTrim(date_);
   if (date_.length < 1) { return ""; }

   const dateObject = DateTime.fromFormat(date_, Constants.DATE_FORMAT.FROM);
   
   const datePart = Utils.safeTrim(dateObject.toFormat(Constants.DATE_FORMAT.TO_DATE));
   const timePart = Utils.safeTrim(dateObject.toFormat(Constants.DATE_FORMAT.TO_TIME));

   return `${datePart} at ${timePart}`;
}

// Format the duration between two date/times.
export function FormatDuration(start_: string, end_: string): string {

   // Validate the input parameters
   start_ = Utils.safeTrim(start_);
   end_ = Utils.safeTrim(end_);
   if (start_.length < 1 || end_.length < 1) { return ""; }

   const startObject = DateTime.fromFormat(start_, Constants.DATE_FORMAT.FROM);
   const endObject = DateTime.fromFormat(end_, Constants.DATE_FORMAT.FROM);
   if (!startObject.isValid || !endObject.isValid) { return ""; }

   const diff = endObject.diff(startObject, ["days", "hours", "minutes", "seconds"]).toObject();

   // Format the duration as "X days, Y hours, Z minutes, W seconds"
   const parts: string[] = [];
   if (diff.days) parts.push(`${diff.days} day${diff.days === 1 ? "" : "s"}`);
   if (diff.hours) parts.push(`${diff.hours} hour${diff.hours === 1 ? "" : "s"}`);
   if (diff.minutes) parts.push(`${diff.minutes} minute${diff.minutes === 1 ? "" : "s"}`);
   if (diff.seconds) parts.push(`${Math.floor(diff.seconds!)} second${Math.floor(diff.seconds!) === 1 ? "" : "s"}`);

   return parts.length > 0 ? parts.join(", ") : "0 seconds";
}

// Generate a universally unique identifier (UUID).
export function GenerateUUID() {

   const bytes = new Uint8Array(16);
   crypto.getRandomValues(bytes);
   
   // Set version (4) and variant bits as per RFC 4122
   bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 (random)
   bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1 (RFC-compliant)
   
   // Convert to hexadecimal format
   return [...bytes].map((b, i) =>
      ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')
   ).join('');
}

// Return a spinner icon and a message.
export function GetSpinnerHTML(message_: string): string {
   return `<span class="spinner-message">${Icon.spinner} ${message_}</span>`;
}

// Expand or collapse a specific accordion widget.
export function ToggleAccordion(containerEl: HTMLElement, itemID_: string) {
      
   const accordionItemEl = containerEl.querySelector(`.ictv-accordion-item[data-id="${itemID_}"]`);
   if (!accordionItemEl) { return; }

   const bodyEl = containerEl.querySelector(`.ictv-accordion-body[data-id="${itemID_}"]`) as HTMLElement;
   if (!bodyEl) { return; }

   if (accordionItemEl.classList.contains("active")) {
      accordionItemEl.classList.remove("active");
      bodyEl.style.maxHeight = "0";
   } else {
      accordionItemEl.classList.add("active");
      bodyEl.style.maxHeight = bodyEl.scrollHeight + "px";
   }
}