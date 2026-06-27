import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";

export class JobSymbolWorkspaceDefinitionsProvider implements vscode.WorkspaceSymbolProvider {
private jobManager = new JobManager();

constructor(jobManager: JobManager) {
this.jobManager = jobManager;
}
provideWorkspaceSymbols(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_query: string,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.ProviderResult<vscode.SymbolInformation[]> {
const jobs = this.jobManager.get_all_jobs();
const workspaceSymbols: vscode.SymbolInformation[] = [];
jobs.forEach((job) => {
const jobName = job.get_name_value();
const jobNameLocation = job.get_location_of_value(jobName);
const jobSymbol = new vscode.SymbolInformation(
jobName as string,
vscode.SymbolKind.Class,
jobName as string,
new vscode.Location(job.document, jobNameLocation.get_as_vscode_location())
);
workspaceSymbols.push(jobSymbol);
});
return workspaceSymbols;
}
}
