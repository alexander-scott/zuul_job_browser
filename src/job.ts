import * as vscode from "vscode";

export class Job {
	constructor(
		private readonly originalText: string,
		public readonly job_name: string,
		public readonly parent_name: string,
		public readonly job_name_location: vscode.Range,
		public readonly parent_name_location: vscode.Range,
		public readonly document: vscode.TextDocument
	) {}
}
