import * as vscode from "vscode";

/**
 * Location of an attribute in vsocde space
 */
export class AttributeLocationData {
	constructor(
		public readonly range: vscode.Range,
		public readonly line_number: number,
		public readonly document: vscode.Uri
	) {}
}
