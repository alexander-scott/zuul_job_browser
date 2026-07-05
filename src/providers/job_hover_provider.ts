import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";
import { JobAttributeCollector, JobAttribute } from "../job_parsing/job_attribute_collector";
import { ProjectTemplateParser } from "../project_template_parsing/project_template_parser";

export class JobHoverProvider implements vscode.HoverProvider {
	constructor(private readonly job_manager: JobManager) {}

	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}

		// Only show hover info when the cursor is inside an Ansible variable reference: {{ var_name }}
		const ansible_var = JobParser.parse_anisble_variable_from_position_in_line(document, position);
		if (!ansible_var) {
			return undefined;
		}

		let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
		if (!job_name) {
			job_name = ProjectTemplateParser.parse_job_name_from_line_in_document(document, position.line);
		}
		if (!job_name) {
			return undefined;
		}

		const job = this.job_manager.get_job_with_name(job_name);
		if (!job) {
			return undefined;
		}

		const attributes = JobAttributeCollector.get_attributes_for_job(job, this.job_manager);
		const selected_attribute = JobAttributeCollector.get_specific_attribute_from_array(attributes, ansible_var);
		if (!selected_attribute) {
			return undefined;
		}

		const resolved_value = JobHoverProvider.resolve_variable_value(selected_attribute.value, attributes);
		const markdown = new vscode.MarkdownString();
		markdown.appendMarkdown(`**${ansible_var}** : ${resolved_value}`);
		return new vscode.Hover(markdown);
	}

	/**
	 * Resolves a variable value by recursively expanding any nested Ansible variable
	 * references (`{{ var_name }}`) found within it.
	 */
	static resolve_variable_value(
		value: string | boolean,
		attributes: { [id: string]: JobAttribute },
		visited: Set<string> = new Set()
	): string {
		if (typeof value !== "string") {
			return String(value);
		}

		const regex = /{{([^}]*)}}/g;
		return value.replace(regex, (match, variable_name: string) => {
			const trimmed = variable_name.trim();
			if (visited.has(trimmed)) {
				return match; // Avoid infinite loops from circular references
			}
			const resolved = JobAttributeCollector.get_specific_attribute_from_array(attributes, trimmed);
			if (resolved) {
				const next_visited = new Set(visited);
				next_visited.add(trimmed);
				return JobHoverProvider.resolve_variable_value(resolved.value, attributes, next_visited);
			}
			return match;
		});
	}
}
