import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";

export class JobReferencesProvider implements vscode.ReferenceProvider {
constructor(
private readonly jobManager: JobManager,
private readonly projectTemplateManager: ProjectTemplateManager
) {}

provideReferences(
document: vscode.TextDocument,
position: vscode.Position,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_context: vscode.ReferenceContext,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.ProviderResult<vscode.Location[]> {
const range = document.getWordRangeAtPosition(position);
if (range) {
const job_name = JobParser.parse_job_from_random_line_number(document, position.line);
if (job_name) {
const job = this.jobManager.get_job_with_name(job_name);
if (job) {
const childJobs = this.jobManager.get_all_jobs_with_this_parent(job_name);
const locations: vscode.Location[] = [];
if (childJobs) {
childJobs.forEach((childJob) => {
const childJobName = childJob.get_name_value();
const childJobNameLocation = childJob.get_location_of_value(childJobName);
const location = new vscode.Location(childJob.document, childJobNameLocation.get_as_vscode_location());
locations.push(location);
});
}
const projectTemplateLocations = this.projectTemplateManager.get_all_jobs_with_name(job_name);
if (projectTemplateLocations) {
projectTemplateLocations.forEach((templateJobLocation) => {
const location = new vscode.Location(templateJobLocation.document, templateJobLocation.get_as_vscode_location());
locations.push(location);
});
}
return locations;
}
}
}
return undefined;
}
}
