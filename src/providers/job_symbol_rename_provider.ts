import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { ProjectTemplateManager } from "../project_template_parsing/project_template_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobRenameProvider implements vscode.RenameProvider {
constructor(
private readonly jobManager: JobManager,
private readonly projectTemplateManager: ProjectTemplateManager
) {}

provideRenameEdits(
document: vscode.TextDocument,
position: vscode.Position,
newName: string,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.ProviderResult<vscode.WorkspaceEdit> {
const range = document.getWordRangeAtPosition(position);
if (range) {
let job_name = JobParser.parse_job_name_from_single_line(document, position.line);
if (!job_name) {
job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
}
if (job_name) {
const job = this.jobManager.get_job_with_name(job_name);
if (job) {
const renameEdit = new vscode.WorkspaceEdit();

// Rename the main job name
const resolvedJobName = job.get_name_value();
const jobNameLocation = job.get_location_of_value(resolvedJobName);
renameEdit.replace(job.document, jobNameLocation.get_as_vscode_location(), newName);

// Rename all child jobs
const childJobs = this.jobManager.get_all_jobs_with_this_parent(resolvedJobName);
if (childJobs) {
childJobs.forEach((childJob) => {
const parent_name = childJob.get_parent_value() as string;
const parent_location = childJob.get_location_of_value(parent_name);
renameEdit.replace(childJob.document, parent_location.get_as_vscode_location(), newName);
});
}

// Rename all instances in project templates
const projectTemplateLocations = this.projectTemplateManager.get_all_jobs_with_name(resolvedJobName);
if (projectTemplateLocations) {
projectTemplateLocations.forEach((templateJobLocation) => {
renameEdit.replace(templateJobLocation.document, templateJobLocation.get_as_vscode_location(), newName);
});
}

return renameEdit;
}
}
}
return undefined;
}

prepareRename?(
document: vscode.TextDocument,
position: vscode.Position,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
const wordRange = document.getWordRangeAtPosition(position);
if (wordRange) {
let job_name = JobParser.parse_job_name_from_single_line(document, position.line);
if (job_name) {
const job = this.jobManager.get_job_with_name(job_name);
if (job) {
const resolvedJobName = job.get_name_value();
const jobNameLocation = job.get_location_of_value(resolvedJobName);
const placeholder = resolvedJobName as string;
const renameRange = jobNameLocation.get_as_vscode_location();
return { range: renameRange, placeholder };
}
}
job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
if (job_name) {
const templateJobLocation = this.projectTemplateManager.get_single_job_on_line(document.uri, position.line);
if (templateJobLocation) {
const placeholder = job_name;
const renameRange = templateJobLocation.get_as_vscode_location();
return { range: renameRange, placeholder };
}
}
}
return undefined;
}
}
