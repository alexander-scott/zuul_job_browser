import * as vscode from "vscode";
import { JobManager } from "./job_manager";
import { JobParser } from "./job_parser";

export class JobHierarchyParser {
	private _jobManager = new JobManager();
	private _jobParser = new JobParser();

	get_job_manager(): JobManager {
		return this._jobManager;
	}

	async parse_all_yaml_files(): Promise<void> {
		const workspace = vscode.workspace.workspaceFolders![0];
		if (workspace) {
			vscode.workspace.findFiles(new vscode.RelativePattern(workspace, "**/zuul.d/*.yaml")).then((results) => {
				results.forEach(async (doc_uri) => {
					let document = await vscode.workspace.openTextDocument(doc_uri);
					this._parseJobHierarchy(document);
				});
			});
		}
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
