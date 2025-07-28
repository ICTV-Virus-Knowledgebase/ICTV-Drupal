
import { AppSettings } from "../../global/AppSettings";
import { DateTime } from "luxon";
import { ISeqSearchJob } from "./ISeqSearchJob";
import { ISearchResults } from "./ISearchResults";
import { JobStatus } from "../../global/Types";
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
   chevronDown = `<i class=\"fa fa-chevron-circle-down expanded\"></i>`,
   chevronRight = `<i class=\"fa fa-chevron-circle-right collapsed\"></i>`,
   close = `<i class=\"fa fa-xmark\"></i>`,
   copy = `<i class=\"fa-regular fa-clipboard\"></i>`,
   csv = `<i class="fa-regular fa-file-csv"></i>`,
   dna = `<i class="fa-solid fa-dna"></i>`,
   download = `<i class=\"fa fa-download\"></i>`,
   html = `<i class="fa-regular fa-file-lines"></i>`,
   lineageDelimiter = `<i class="fa-solid fa-chevron-right"></i>`,
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
   sequence = "sequence"
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



//----------------------------------------------------------------------------------------------------------------
// Test data (delete soon!!!)
//----------------------------------------------------------------------------------------------------------------

export const testTaxResult: ISearchResults = {
   "program_name": "seqsearch",
   "version": "v0.4.c3ea68b",
   "database_name": "./blast/ICTV_VMR_b",
   "database_title": "ICTV VMR_MSL40.v1.20250307 (all) 21,512 sequences; 615,199,202 total bases Date: Jun 5, 2025  10:26 AM Longest sequence: 4,857,450 bases",
   "input_dir": "seq_in",
   "errors": "",
   "files": [
      {
         "name": "AeropyrumAndEntebbe.fasta",
         "sequences": [
            {
               "qseqid": "NC_043427.1",
               "blast_csv": "AeropyrumAndEntebbe_1.fasta.csv",
               "blast_html": "AeropyrumAndEntebbe_1.fasta.html",
               "status": "HITS",
               "errors": "",
               "hits": [
                  {
                     "input_seq": "AeropyrumAndEntebbe",
                     "evalue": 0,
                     "bitscore": 45969,
                     "qseqid": "NC_043427.1",
                     "sseqid": "Alphaspiravirus_yamagawaense--HE681887.1",
                     "ICTV_ID": "ICTV20133580",
                     "isolate_id": "VMR1005681",
                     "exemplar_additional": "E",
                     "virus_names": "Aeropyrum coil-shaped virus",
                     "start_loc": null,
                     "end_loc": null,
                     "sseqid_lineage": {
                        "realm": null,
                        "family": "Spiraviridae",
                        "subfamily": null,
                        "phylum": null,
                        "class": null,
                        "order": null,
                        "genus": "Alphaspiravirus",
                        "species": "Alphaspiravirus yamagawaense",
                        "kingdom": null,
                        "subkingdom": null,
                        "subphylum": null,
                        "subrealm": null,
                        "subclass": null,
                        "suborder": null,
                        "subgenus": null
                     },
                     "segmentname": null,
                     "sseqid_accession": "HE681887.1"
                  }
               ]
            },
            {
               "qseqid": "DQ837641.1",
               "blast_csv": "AeropyrumAndEntebbe_2.fasta.csv",
               "blast_html": "AeropyrumAndEntebbe_2.fasta.html",
               "status": "HITS",
               "errors": "",
               "hits": [
                  {
                     "input_seq": "AeropyrumAndEntebbe",
                     "evalue": 0,
                     "bitscore": 19409,
                     "qseqid": "DQ837641.1",
                     "sseqid": "Orthoflavivirus_entebbeense--DQ837641.1",
                     "ICTV_ID": "ICTV19710100",
                     "isolate_id": "VMR1009070",
                     "exemplar_additional": "E",
                     "virus_names": "Entebbe bat virus",
                     "start_loc": null,
                     "end_loc": null,
                     "sseqid_lineage": {
                        "realm": "Riboviria",
                        "family": "Flaviviridae",
                        "subfamily": null,
                        "phylum": "Kitrinoviricota",
                        "class": "Flasuviricetes",
                        "order": "Amarillovirales",
                        "genus": "Orthoflavivirus",
                        "species": "Orthoflavivirus entebbeense",
                        "kingdom": "Orthornavirae",
                        "subkingdom": null,
                        "subphylum": null,
                        "subrealm": null,
                        "subclass": null,
                        "suborder": null,
                        "subgenus": null
                     },
                     "segmentname": null,
                     "sseqid_accession": "DQ837641.1"
                  },
                  {
                     "input_seq": "AeropyrumAndEntebbe",
                     "evalue": 1.2900000000000001e-31,
                     "bitscore": 145,
                     "qseqid": "DQ837641.1",
                     "sseqid": "Orthoflavivirus_kedougouense--AY632540.2",
                     "ICTV_ID": "ICTV19990830",
                     "isolate_id": "VMR1009079",
                     "exemplar_additional": "E",
                     "virus_names": "Kédougou virus",
                     "start_loc": null,
                     "end_loc": null,
                     "sseqid_lineage": {
                        "realm": "Riboviria",
                        "family": "Flaviviridae",
                        "subfamily": null,
                        "phylum": "Kitrinoviricota",
                        "class": "Flasuviricetes",
                        "order": "Amarillovirales",
                        "genus": "Orthoflavivirus",
                        "species": "Orthoflavivirus kedougouense",
                        "kingdom": "Orthornavirae",
                        "subkingdom": null,
                        "subphylum": null,
                        "subrealm": null,
                        "subclass": null,
                        "suborder": null,
                        "subgenus": null
                     },
                     "segmentname": null,
                     "sseqid_accession": "AY632540.2"
                  },
                  {
                     "input_seq": "AeropyrumAndEntebbe",
                     "evalue": 3.7e-12,
                     "bitscore": 80.5,
                     "qseqid": "DQ837641.1",
                     "sseqid": "Orthoflavivirus_murrayense--AF161266.1",
                     "ICTV_ID": "ICTV19990839",
                     "isolate_id": "VMR1009089",
                     "exemplar_additional": "E",
                     "virus_names": "Murray Valley encephalitis virus",
                     "start_loc": null,
                     "end_loc": null,
                     "sseqid_lineage": {
                        "realm": "Riboviria",
                        "family": "Flaviviridae",
                        "subfamily": null,
                        "phylum": "Kitrinoviricota",
                        "class": "Flasuviricetes",
                        "order": "Amarillovirales",
                        "genus": "Orthoflavivirus",
                        "species": "Orthoflavivirus murrayense",
                        "kingdom": "Orthornavirae",
                        "subkingdom": null,
                        "subphylum": null,
                        "subrealm": null,
                        "subclass": null,
                        "suborder": null,
                        "subgenus": null
                     },
                     "segmentname": null,
                     "sseqid_accession": "AF161266.1"
                  },
                  {
                     "input_seq": "AeropyrumAndEntebbe",
                     "evalue": 0.00000482,
                     "bitscore": 60.2,
                     "qseqid": "DQ837641.1",
                     "sseqid": "Orthoflavivirus_denguei--U88536.1",
                     "ICTV_ID": "ICTV19990820",
                     "isolate_id": "VMR1012787",
                     "exemplar_additional": "A",
                     "virus_names": "dengue virus type 1",
                     "start_loc": null,
                     "end_loc": null,
                     "sseqid_lineage": {
                        "realm": "Riboviria",
                        "family": "Flaviviridae",
                        "subfamily": null,
                        "phylum": "Kitrinoviricota",
                        "class": "Flasuviricetes",
                        "order": "Amarillovirales",
                        "genus": "Orthoflavivirus",
                        "species": "Orthoflavivirus denguei",
                        "kingdom": "Orthornavirae",
                        "subkingdom": null,
                        "subphylum": null,
                        "subrealm": null,
                        "subclass": null,
                        "suborder": null,
                        "subgenus": null
                     },
                     "segmentname": null,
                     "sseqid_accession": "U88536.1"
                  }
               ]
            }
         ]
      }
   ]
}

export const testJob: ISeqSearchJob = {
   createdOn: "2025-07-22",
   data: testTaxResult,
   endedOn: "2025-07-22",
   name: "Test JSON data",
   message: null,
   status: JobStatus.complete,
   uid: "abc123"
} as ISeqSearchJob;