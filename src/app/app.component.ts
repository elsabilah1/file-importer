import { Component } from "@angular/core";
import * as XLSX from "xlsx";
import { z } from "zod";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  excelFile: File | undefined;
  status: string | undefined;
  previewJSON: string | undefined;
  isProcessing: boolean = false;
  errors: any[] = [];

  getBadgeClass() {
    return "badge " + this.status?.toLowerCase();
  }

  onSelect(event: any) {
    this.excelFile = event.addedFiles[0];
    this.status = "Draft";
  }

  onRemove() {
    this.excelFile = undefined;
    this.status = undefined;
    this.previewJSON = undefined;
    this.errors = [];
  }

  handleImport() {
    if (!this.excelFile) return;

    this.previewJSON = undefined;
    this.isProcessing = true;

    // read excel file
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(this.excelFile!);
    let binaryData;

    fileReader.onload = (event: any) => {
      binaryData = event.target.result;
      let workbook = XLSX.read(binaryData, { type: "binary" });

      // parse to json format
      const data = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);

      // validate data
      const dataSchema = z.object({
        ID: z.coerce.string().length(8),
        NAME: z.string(),
        GENDER: z.number().min(1).max(2),
        "BIRTH DATE": z.coerce.date(),
        "BIRTH PLACE": z.string().optional(),
      });

      data.map((item, i) => {
        const result = dataSchema.safeParse(item);
        if (!result.success) {
          const formatted = result.error.issues;
          this.errors.push({
            row: i + 1,
            errors: formatted,
          });
        }
      });

      // console.log(this.errors);

      this.isProcessing = false;
      if (this.errors.length > 0) {
        this.status = "failed";
        return;
      }

      // if no errors process the data
      /*
       * such as saving data to db
       * write the script here
       */

      // example preview data
      this.previewJSON = JSON.stringify(data, undefined, 4);
      this.status = "success";
    };
  }
}
