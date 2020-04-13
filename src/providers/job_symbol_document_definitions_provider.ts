import * as vscode from "vscode";
import { JobDefinitionManager } from "../job_definition_manager";

export class JobSymbolDocumentDefinitionsProvider implements vscode.DocumentSymbolProvider {
	private job_manager = new JobDefinitionManager();

	constructor(job_manager: JobDefinitionManager) {
		this.job_manager = job_manager;
	}
	provideDocumentSymbols(
		document: vscode.TextDocument,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let jobs = this.job_manager.get_all_jobs_in_document(document.uri);
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
