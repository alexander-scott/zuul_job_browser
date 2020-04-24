import * as vscode from "vscode";

export class AttributeLocationData {
	constructor(
		public readonly range: vscode.Range,
		public readonly line_number: number,
		public readonly document: vscode.Uri
	) {}
}
