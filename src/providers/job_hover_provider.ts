import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { JobAttributeCollector } from "../job_parsing/job_attribute_collector";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobHoverProvider implements vscode.HoverProvider {
	private markdown_links = false;

	constructor(private readonly job_manager: JobManager) {}
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		const range = document.getWordRangeAtPosition(position);
		if (range) {
			let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			if (job_name) {
				const markdown = new vscode.MarkdownString();
				const job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					const attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
					for (const key in attributes) {
						const att = attributes[key];
						if (this.markdown_links) {
							// markdown.appendMarkdown(
							// 	key +
							// 		" : [" +
							// 		value.value +
							// 		"](" +
							// 		value.location.document.fsPath +
							// 		"#L" +
							// 		value.location.line_number +
							// 		")\n\n"
							// );
						} else {
							markdown.appendMarkdown(key + " : " + att.value + "\n\n");
						}
					}
					return new vscode.Hover(markdown);
				}
			}
			job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
			if (job_name) {
				const job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					const markdown = new vscode.MarkdownString();
					const attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
					for (const key in attributes) {
						const att = attributes[key];
						if (this.markdown_links) {
							// markdown.appendMarkdown(
							// 	key +
							// 		" : [" +
							// 		value.value +
							// 		"](" +
							// 		value.location.document.fsPath +
							// 		"#L" +
							// 		value.location.line_number +
							// 		")\n\n"
							// );
						} else {
							markdown.appendMarkdown(key + " : " + att.value + "\n\n");
						}
					}
					return new vscode.Hover(markdown);
				}
			}
		}
		return undefined;
	}
}
