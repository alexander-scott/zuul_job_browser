import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";

export class JobSymbolDocumentDefinitionsProvider implements vscode.DocumentSymbolProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
		this.job_manager = job_manager;
	}
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let jobs = this.job_manager.get_all_jobs_in_document(document.uri);
		let symbols: vscode.SymbolInformation[] = [];
		jobs.forEach((job) => {
			let job_name = job.get_name_value();
			let job_name_location = job.get_location_of_value(job_name);
			let symbol = new vscode.SymbolInformation(
				job_name as string,
				vscode.SymbolKind.Class,
				job_name as string,
				new vscode.Location(job.document, job_name_location.vscode_location)
			);
			symbols.push(symbol);
		});
		return symbols;
	}
}
