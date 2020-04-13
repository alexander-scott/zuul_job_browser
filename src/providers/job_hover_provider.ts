import * as vscode from "vscode";
import { JobParser } from "../job_parser";
import { JobDefinitionManager } from "../job_definition_manager";
import { JobAttributeCollector } from "../job_attribute_collector";

export class JobHoverProvider implements vscode.HoverProvider {
	private job_manager = new JobDefinitionManager();
	private markdown_links = false;

	constructor(job_manager: JobDefinitionManager) {
		this.job_manager = job_manager;
	}
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job = new JobParser().parse_job_from_line_number(document, position.line);
			if (job) {
				let markdown = new vscode.MarkdownString();
				let attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
				for (let key in attributes) {
					let value = attributes[key];
					if (this.markdown_links) {
						markdown.appendMarkdown(
							key +
								" : [" +
								value.attribute_value +
								"](" +
								value.document.fsPath +
								"#L" +
								value.attribute_line_number +
								")\n\n"
						);
					} else {
						markdown.appendMarkdown(key + " : " + value.attribute_value + "\n\n");
					}
				}
				return new vscode.Hover(markdown);
			}
		}
		return undefined;
	}
}
