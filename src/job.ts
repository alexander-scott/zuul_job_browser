import * as vscode from "vscode";

export class Job {
	constructor(
		public readonly job_name: string,
		public readonly parent_name: string,
		public readonly job_name_location: vscode.Range,
		public readonly parent_name_location: vscode.Range,
		public readonly document: vscode.TextDocument
	) {}
}

export class JobAttribute {
	constructor(
		public readonly attribute_key: string,
		public readonly attribute_value: string,
		public readonly attribute_location: vscode.Range,
		public readonly document: vscode.Uri
	) {}
}
