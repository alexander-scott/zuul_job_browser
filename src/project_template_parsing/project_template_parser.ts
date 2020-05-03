import * as vscode from "vscode";

export class ProjectTemplateParser {
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
