

// CSS class names for buttons.
export enum ButtonClass {
   cancel = "cancel-button",
   copyURL = "copy-url-button",
   downloadCSV = "download-csv-button",
   upload = "upload-button",
   viewHits = "view-hits",
   viewHTML = "view-html-button"
}

export const Constants = {

   // The maximum number of sequences that can be uploaded.
   MAX_SEQUENCE_COUNT: 64,

   NO_EMAIL: "NO_EMAIL"
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
   backToJob = "backToJob",
   backToUpload = "backToUpload",
   displayJob = "displayJob",
   displayBLAST = "displayBLAST",
   displayUpload = "displayUpload"
}

export enum PanelKey {
   blastPanel = "blastPanel",
   jobPanel = "jobPanel",
   uploadPanel = "uploadPanel"
}

