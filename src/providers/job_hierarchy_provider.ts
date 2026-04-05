import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {
private jobManager = new JobManager();

constructor(jobManager: JobManager) {
this.jobManager = jobManager;
}

prepareCallHierarchy(
document: vscode.TextDocument,
position: vscode.Position,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.CallHierarchyItem | undefined {
const range = document.getWordRangeAtPosition(position);
if (range) {
// Find the closest job from where the user has selected
const selectedJobName = JobParser.parse_job_from_random_line_number(document, position.line);
// Highlight the job name
if (selectedJobName) {
const job = this.jobManager.get_job_with_name(selectedJobName);
if (job) {
const jobName = job.get_name_value();
const jobNameLocation = job.get_location_of_value(jobName);
return this.createCallHierarchyItem(
jobName,
"job",
document.uri,
jobNameLocation.get_as_vscode_location()
);
}
}
}
return undefined;
}

async provideCallHierarchyOutgoingCalls(
item: vscode.CallHierarchyItem,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): Promise<vscode.CallHierarchyOutgoingCall[]> {
const outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];
const parent_job = this.jobManager.get_parent_job_from_job_name(item.name);
if (parent_job) {
const jobName = parent_job.get_name_value();
const jobNameLocation = parent_job.get_location_of_value(jobName);
const parentJobCallItem = this.createCallHierarchyItem(
jobName,
"parent",
parent_job.document,
jobNameLocation.get_as_vscode_location()
);
const outgoingCallItem = new vscode.CallHierarchyOutgoingCall(parentJobCallItem, [
jobNameLocation.get_as_vscode_location(),
]);
outgoingCallItems.push(outgoingCallItem);
}

return outgoingCallItems;
}

async provideCallHierarchyIncomingCalls(
item: vscode.CallHierarchyItem,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): Promise<vscode.CallHierarchyIncomingCall[]> {
const incomingCallItems: vscode.CallHierarchyIncomingCall[] = [];
const childJobsWithThisParent = this.jobManager.get_all_jobs_with_this_parent(item.name);

childJobsWithThisParent.forEach((childJob) => {
const jobName = childJob.get_name_value();
const jobNameLocation = childJob.get_location_of_value(jobName);
const childJobCallItem = this.createCallHierarchyItem(
jobName as string,
"child",
childJob.document,
jobNameLocation.get_as_vscode_location()
);
const incomingCallItem = new vscode.CallHierarchyIncomingCall(childJobCallItem, [
jobNameLocation.get_as_vscode_location(),
]);
incomingCallItems.push(incomingCallItem);
});

return incomingCallItems;
}

private createCallHierarchyItem(
jobName: string,
hierarchyType: string,
document: vscode.Uri,
range: vscode.Range
): vscode.CallHierarchyItem {
return new vscode.CallHierarchyItem(vscode.SymbolKind.Object, jobName, `(${hierarchyType})`, document, range, range);
}
}
