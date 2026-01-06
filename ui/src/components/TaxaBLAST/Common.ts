
import { AppSettings } from "../../global/AppSettings";
import { DateTime } from "luxon";
import { JobStatus } from "../../global/Types";
import { Utils } from "../../helpers/Utils";
import { ITaxaBlastJob } from "./ITaxaBlastJob";


//----------------------------------------------------------------------------------------------------------------
// Enums
//----------------------------------------------------------------------------------------------------------------

// The available BLAST programs.
export enum BlastTask {
   megablast = "megablast",
   dcMegablast = "dc-megablast",
   blastn = "blastn",
   blastp = "blastp"
}

// CSS class names for buttons.
export enum ButtonClass {
   add = "add-button",
   back = "back-button",
   cancel = "cancel-button",
   copyURL = "copy-url-button",
   downloadCSV = "download-csv-button",
   enterFASTA = "enter-fasta-button",
   errorLink = "error-link-button",
   link = "link-button",
   newSearch = "new-search-button",
   openDialog = "open-dialog-button",
   removeFiles = "remove-files-button",
   selectFiles = "select-files-button",
   start = "start-button",
   toggle = "toggle-button",
   upload = "upload-button",
   viewHits = "view-hits",
   viewHTML = "view-html-button"
}

export enum Icon {
   add = `<i class=\"fa-solid fa-plus\"></i>`,
   back = `<i class=\"fa-solid fa-angle-left\"></i>`,
   browse = `<i class=\"fa fa-file\"></i>`,
   cancel = `<i class=\"fa-solid fa-xmark\"></i>`,
   chevronDown = `<i class=\"fa fa-chevron-down expanded\"></i>`,
   chevronRight = `<i class=\"fa fa-chevron-up collapsed\"></i>`,
   clear = `<i class=\"fa-solid fa-broom\"></i>`,
   close = `<i class=\"fa fa-xmark\"></i>`,
   copy = `<i class=\"fa-regular fa-clipboard\"></i>`,
   csv = `<i class=\"fa-regular fa-file-csv\"></i>`,
   delete = `<i class=\"fa-solid fa-trash\"></i>`,
   dna = `<i class=\"fa-solid fa-dna\"></i>`,
   edit = `<i class=\"fa-solid fa-pen-to-square\"></i>`,
   error = `<i class=\"fa-solid fa-triangle-exclamation error\"></i>`,
   download = `<i class=\"fa fa-download\"></i>`,
   html = `<i class=\"fa-regular fa-file-lines\"></i>`,
   info = `<i class=\"fa-solid fa-circle-info\"></i>`,
   lineageDelimiter = `<i class=\"fa-solid fa-chevron-right\"></i>`,
   link = `<i class=\"fa-solid fa-link\"></i>`,
   next = `<i class=\"fa-regular fa-angle-right\"></i>`,
   paste = `<i class=\"fa-solid fa-paste\"></i>`,
   run = `<i class="fa-sharp fa-circle-play"></i>`,
   repeat = `<i class=\"fa-solid fa-repeat\"></i>`,
   save = `<i class=\"fa-solid fa-floppy-disk\"></i>`,
   search = `<i class=\"fa-solid fa-magnifying-glass\"></i>`,
   spinner = `<i class=\"fa fa-spinner fa-spin spinner-icon\"></i>`,
   success = `<i class=\"fa-solid fa-circle-check success\"></i>`,
   toggleOn = `<i class=\"fa-solid fa-toggle-on\"></i>`,
   toggleOff = `<i class=\"fa-solid fa-toggle-off\"></i>`,
   upload = `<i class=\"fa fa-upload\"></i>`,
   valid = `<i class=\"fa-regular fa-badge-check\"></i>`
}

export enum PanelAction {
   displayError = "displayError",
   displayHistory = "displayHistory",
   displayJob = "displayJob",
   displayBlastHits = "displayBlastHits",
   displayInput = "displayInput"
}

// The order of panels is FASTA input, job submission, pending job, jobDetails, blastHits (short circuiting
// to the error panel as necessary).
export enum PanelKey {
   blastHits = "blastHits", 
   fastaInput = "fastaInput",
   jobDetails = "jobDetails",
   jobHistory = "jobHistory",
   jobSubmission = "jobSubmission",
   message = "message",
   pendingJob = "pendingJob"
}

export enum ParameterKey {
   file = "file",
   filename = "filename",
   history = "history", // TESTING
   job = "job",
   sequence = "sequence",
   userUID = "userUID",

   // BLAST parameters
   maxHSPS = "max_hsps",
   maxTargetSeqs = "max_target_seqs",
   task = "task"
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
   // TODO: Make sure this list is consistent with the seqsearch Python file in the ICTVseqsearch GitHub repo.
   ACCEPTED_FILE_TYPES: [".fa", ".fas", ".fasta", ".ffn", ".fna", ".frn", ".fsa", ".seq", ".txt"],

   // The application name
   APPLICATION_NAME: "TaxaBLAST",

   // Date and time format strings.
   DATE_FORMAT: {
      FROM: "yyyy-MM-dd HH:mm:ss",
      TO_DATE: "cccc, LLLL d, y",
      TO_TIME: "h:mm:ss a"
   },

   // The default BLAST program to use.
   DEFAULT_BLAST_TASK: BlastTask.blastn,

   // The maximum number of HSPS (high-scoring segment pairs) to return per target sequence.
   DEFAULT_MAX_HSPS: 25,

   // The default maximum number of target sequences to return.
   DEFAULT_MAX_TARGET_SEQS: 50,

   // How long should the upload panel wait to try to load job data?
   JOB_POLLING_INTERVAL: 3000,

   // The maximum total file size that can be uploaded.
   MAX_FILE_SIZE_TOTAL: 1e+9,

   // The maximum number of sequences that can be uploaded.
   MAX_SEQUENCE_COUNT: 100,

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


// If the job is invalid or has a status other than "complete" (or valid), display an appropriate message in
// the container element provided. The boolean value that's returned indicates whether a message was displayed.
export function DisplayMessageForIncompleteJob(containerEl_: HTMLElement, job_: ITaxaBlastJob): boolean {

   console.log("in DisplayMessageForIncompleteJob")
   
   let isIncomplete = true;
   let message = "";

   if (!job_ || !job_.status) {
      // TODO: Include a "return to upload panel" button.
      message = `An unknown error occurred and the job data is invalid.`;

   } else if ([JobStatus.crashed, JobStatus.error, JobStatus.invalid].includes(job_.status as JobStatus)) {
      // TODO: Include a "return to upload panel" button.
      message = `Job \"${job_.name}\" has status \"${job_.status}\"`;
      if (job_.message !== null && job_.message.length > 0) { message += `with message \"${job_.message}\"`; }

   } else if (job_.status as JobStatus === JobStatus.pending) {
      // TODO: Include a "copy URL" control?
      message = `Job \"${job_.name}\" is in pending status. Please return to this page later to see the completed results.`;

   } else if (!job_.data) { 
      message = `Job \"${job_.name}\" has completed but did not return any data`;
      
   } else {
      isIncomplete = false;
   }

   if (isIncomplete) { containerEl_.innerHTML = `<div class="no-results">${message}</div>`; }

   return isIncomplete;
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


// Labels for the available BLAST programs.
export function GetBlastTaskDescription(task_: BlastTask) {

   let label = "";

   switch (task_) {
      case BlastTask.blastn:
         label = "somewhat similar nucleotide sequences";
         break;
      case BlastTask.blastp:
         label = "somewhat similar protein sequences";
         break;
      case BlastTask.dcMegablast:
         label = "more dissimilar sequences";
         break;
      case BlastTask.megablast:
         label = "highly similar sequences";
         break;
      default:
         label = "unknown";
   }

   return label;
}


// Get a label for a BLAST task.
export function GetBlastTaskLabel(task_: BlastTask) {

   let label = "";

   switch (task_) {
      case BlastTask.blastn:
         label = "blastn";
         break;
      case BlastTask.blastp:
         label = "blastp";
         break;
      case BlastTask.dcMegablast:
         label = "dc-megablast (discontiguous megablast)";
         break;
      case BlastTask.megablast:
         label = "megablast";
         break;
      default:
         label = "unknown";
   }

   return label;
}

// Return a spinner icon and a message.
export function GetSpinnerHTML(message_: string): string {
   return `<span class="spinner-message">${Icon.spinner} ${message_}</span>`;
}


// Read the contents of a file asynchronously and return it as a base64-encoded string.
export async function ReadFileAsync(file_): Promise<string> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
         resolve(<string>reader.result);
      };
      reader.onerror = reject;
      reader.readAsText(file_);
   })
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