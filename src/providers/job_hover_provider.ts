import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";
import { JobAttributeCollector } from "../job_parsing/job_attribute_collector";
import { ProjectTemplateJobManager } from "../project_template_parsing/project_template_job_manager";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobHoverProvider implements vscode.HoverProvider {
	private markdown_links = false;

	constructor(
		private readonly job_manager: JobDefinitionManager,
		private readonly project_template_manager: ProjectTemplateJobManager
	) {}
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			if (this.job_manager.is_known_file(document.uri)) {
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
			} else if (this.project_template_manager.is_known_file(document.uri)) {
				let job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
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
			}
		}
		return undefined;
	}
}
