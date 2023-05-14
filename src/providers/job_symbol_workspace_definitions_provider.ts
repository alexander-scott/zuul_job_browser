import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";

export class JobSymbolWorkspaceDefinitionsProvider implements vscode.WorkspaceSymbolProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
		this.job_manager = job_manager;
	}
	provideWorkspaceSymbols(
		_query: string,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.SymbolInformation[]> {
		const jobs = this.job_manager.get_all_jobs();
		const symbols: vscode.SymbolInformation[] = [];
		jobs.forEach((job) => {
			const job_name = job.get_name_value();
			const name_location = job.get_location_of_value(job_name);
			const symbol = new vscode.SymbolInformation(
				job_name as string,
				vscode.SymbolKind.Class,
				job_name as string,
				new vscode.Location(job.document, name_location.get_as_vscode_location())
			);
			symbols.push(symbol);
		});
		return symbols;
	}
}
