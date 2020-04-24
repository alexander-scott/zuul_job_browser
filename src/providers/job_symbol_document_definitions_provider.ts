import * as vscode from "vscode";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";

export class JobSymbolDocumentDefinitionsProvider implements vscode.DocumentSymbolProvider {
	private job_manager = new JobDefinitionManager();

	constructor(job_manager: JobDefinitionManager) {
		this.job_manager = job_manager;
	}
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let jobs = this.job_manager.get_all_jobs_in_document(document.uri);
		let symbols: vscode.SymbolInformation[] = [];
		jobs.forEach((job) => {
			let job_name = job.get_job_name_attribute();
			let symbol = new vscode.SymbolInformation(
				job_name.value as string,
				vscode.SymbolKind.Class,
				job_name.value as string,
				new vscode.Location(job_name.location.document, job_name.location.range)
			);
			symbols.push(symbol);
		});
		return symbols;
	}
}
