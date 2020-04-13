import * as vscode from "vscode";
import { JobManager } from "../job_manager";

export class JobSymbolWorkspaceDefinitionsProvider implements vscode.WorkspaceSymbolProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
		this.job_manager = job_manager;
	}
	provideWorkspaceSymbols(
		query: string,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.SymbolInformation[]> {
		let jobs = this.job_manager.get_all_jobs();
		let symbols: vscode.SymbolInformation[] = [];
		jobs.forEach((job) => {
			let job_name = job.get_job_name_attribute();
			let symbol = new vscode.SymbolInformation(
				job_name.attribute_value,
				vscode.SymbolKind.Class,
				job_name.attribute_value,
				new vscode.Location(job_name.document, job_name.attribute_location)
			);
			symbols.push(symbol);
		});
		return symbols;
	}
}
