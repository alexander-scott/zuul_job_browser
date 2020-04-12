import * as vscode from "vscode";
import { JobHierarchyParser } from "./job_hierarchy_parser";
import { JobParser } from "./job_parser";

export class JobHoverProvider implements vscode.HoverProvider {
	private job_hierarchy_provider = new JobHierarchyParser();

	constructor(parser: JobHierarchyParser) {
		this.job_hierarchy_provider = parser;
	}
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Make sure we are at a parent
			let job = new JobParser().parse_job_from_line_number(document, position.line);
			if (job) {
				return new vscode.Hover(job.job_name);
			}
		}
		return undefined;
	}
}
