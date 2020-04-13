import * as vscode from "vscode";
import { JobDefinitionManager } from "./job_definition_manager";
import { JobParser } from "./job_parser";

export class JobDefinitionparser {
	static parse_job_definitions_in_document(textDocument: vscode.TextDocument, jobManager: JobDefinitionManager): void {
		let job_parser = new JobParser();
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while ((match = job_regex.exec(textDocument.getText()))) {
			let line_number = textDocument.positionAt(match.index).line;
			let job = job_parser.parse_job_from_line_number(textDocument, line_number);
			if (job) {
				jobManager.add_job(job);
			}
		}
	}
}
