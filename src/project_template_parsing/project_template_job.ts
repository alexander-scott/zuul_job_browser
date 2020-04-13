import * as vscode from "vscode";

export class ProjectTemplateJob {
	constructor(
		public readonly job_name: string,
		public readonly job_location: vscode.Range,
		public readonly job_line_number: number,
		public readonly document: vscode.Uri
	) {}
}
