import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";

export class JobSymbolDocumentDefinitionsProvider implements vscode.DocumentSymbolProvider {
private jobManager = new JobManager();

constructor(jobManager: JobManager) {
this.jobManager = jobManager;
}
provideDocumentSymbols(
document: vscode.TextDocument,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_token: vscode.CancellationToken
): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
const jobs = this.jobManager.get_all_jobs_in_document(document.uri);
const documentSymbols: vscode.SymbolInformation[] = [];
jobs.forEach((job) => {
const jobName = job.get_name_value();
const jobNameLocation = job.get_location_of_value(jobName);
const jobSymbol = new vscode.SymbolInformation(
jobName as string,
vscode.SymbolKind.Class,
jobName as string,
new vscode.Location(job.document, jobNameLocation.get_as_vscode_location())
);
documentSymbols.push(jobSymbol);
});
return documentSymbols;
}
}
