import * as vscode from "vscode";
import { ProjectTemplate } from "../data_structures/project_template";
import { Location } from "../data_structures/location";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateManager {
private projectTemplates: ProjectTemplate[] = [];

add_project_template(project_template: ProjectTemplate) {
this.projectTemplates.push(project_template);
}

remove_all_templates_in_document(uri: vscode.Uri): void {
this.projectTemplates = this.projectTemplates.filter((template) => template.document.path !== uri.path);
}

remove_all_templates() {
this.projectTemplates = [];
}

get_all_jobs_with_name(job_name: string): Location[] {
const locations: Location[] = [];
this.projectTemplates.forEach((template) => {
locations.push(...template.get_all_locations_with_value(job_name));
});
return locations;
}

get_single_job_on_line(document: vscode.Uri, line_number: number): Location | undefined {
const validTemplates = this.projectTemplates.filter((template) => template.document.path === document.path);
for (const key in validTemplates) {
const jobOnLine = validTemplates[key].get_all_value_locations().find((location) => location.line_number === line_number);
if (jobOnLine) {
return jobOnLine;
}
}
return undefined;
}

get_first_job_with_name(job_name: string): Location | undefined {
for (const key in this.projectTemplates) {
const location = this.projectTemplates[key].get_all_value_locations().find((loc) => loc.value === job_name);
if (location) {
return location;
}
}
return undefined;
}

get_all_project_templates(): ProjectTemplate[] {
return this.projectTemplates;
}
}
