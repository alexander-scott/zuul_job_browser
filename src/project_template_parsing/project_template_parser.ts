import * as vscode from "vscode";

export class ProjectTemplateParser {
	static parse_job_name_from_line_in_document(
		textDocument: vscode.TextDocument,
		line_number: number
	): string | undefined {
		const job_regex = /(?<=\s-).*/gm;
		const job_line = textDocument.lineAt(line_number).text;
		if (job_regex.exec(job_line)) {
			const job_name = job_line
				.substr(job_line.indexOf("-") + 1)
				.replace(/\s/g, "")
				.replace(":", "");
			return job_name;
		}
		return undefined;
	}
}
