import * as vscode from "vscode";
import { ProjectTemplateJobManager } from "./project_template_job_manager";
import { ProjectTemplateJob } from "./project_template_job";

export class ProjectTemplateParser {
	static parse_project_template_in_document(
		textDocument: vscode.TextDocument,
		job_manager: ProjectTemplateJobManager
	): void {
		let proj_template_regex = /(?<=- project-template:).*/gm;
		let job_regex = /(?<=\s-).*/gm;
		let match: RegExpExecArray | null;
		if (proj_template_regex.exec(textDocument.getText())) {
			while ((match = job_regex.exec(textDocument.getText()))) {
				let line_number = textDocument.positionAt(match.index).line;
				let job_line = textDocument.lineAt(line_number);
				let job_name = job_line.text
					.substr(job_line.text.indexOf("-") + 1)
					.replace(/\s/g, "")
					.replace(":", "");
				job_manager.add_job(new ProjectTemplateJob(job_name, job_line.range, line_number, textDocument.uri));
			}
		}
	}

	static parse_job_name_from_line_in_document(
		textDocument: vscode.TextDocument,
		line_number: number
	): string | undefined {
		let job_regex = /(?<=\s-).*/gm;
		let job_line = textDocument.lineAt(line_number).text;
		if (job_regex.exec(job_line)) {
			let job_name = job_line
				.substr(job_line.indexOf("-") + 1)
				.replace(/\s/g, "")
				.replace(":", "");
			return job_name;
		}
		return undefined;
	}
}
