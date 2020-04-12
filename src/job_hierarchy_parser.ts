import * as vscode from "vscode";
import { JobManager } from "./job_manager";
import { JobParser } from "./job_parser";
import { Job } from "./job";

export class JobHierarchyParser {
	private _jobManager = new JobManager();
	private _jobParser = new JobParser();

	getJobManager(): JobManager {
		return this._jobManager;
	}

	parse(textDocument: vscode.TextDocument): void {
		this._parseJobHierarchy(textDocument);
	}

	_parseJobHierarchy(textDocument: vscode.TextDocument): void {
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while ((match = job_regex.exec(textDocument.getText()))) {
			let line_number = textDocument.positionAt(match.index).line;
			let job = this._jobParser.parse_job_from_line_number(textDocument, line_number);
			if (job) {
				this._jobManager.add_job(job);
			}
		}
	}
}
