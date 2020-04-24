import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { JobAttributeCollector } from "../job_parsing/job_attribute_collector";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobHoverProvider implements vscode.HoverProvider {
	private markdown_links = false;

	constructor(private readonly job_manager: JobDefinitionManager) {}
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job_name = new JobParser().parse_job_from_line_number(document, position.line);
			if (job_name) {
				let markdown = new vscode.MarkdownString();
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
					for (let key in attributes) {
						let value = attributes[key];
						if (this.markdown_links) {
							markdown.appendMarkdown(
								key +
									" : [" +
									value.value +
									"](" +
									value.location.document.fsPath +
									"#L" +
									value.location.line_number +
									")\n\n"
							);
						} else {
							markdown.appendMarkdown(key + " : " + value.value + "\n\n");
						}
					}
					return new vscode.Hover(markdown);
				}
			}
			job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let markdown = new vscode.MarkdownString();
					let attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
					for (let key in attributes) {
						let value = attributes[key];
						if (this.markdown_links) {
							markdown.appendMarkdown(
								key +
									" : [" +
									value.value +
									"](" +
									value.location.document.fsPath +
									"#L" +
									value.location.line_number +
									")\n\n"
							);
						} else {
							markdown.appendMarkdown(key + " : " + value.value + "\n\n");
						}
					}
					return new vscode.Hover(markdown);
				}
			}
		}
		return undefined;
	}
}
