import * as vscode from "vscode";

export class AttributeLocationData {
	constructor(
		public attribute_key: string,
		public attribute_value: string,
		public readonly attribute_location: vscode.Range,
		public readonly attribute_line_number: number,
		public readonly document: vscode.Uri
	) {}
}

export class RawLocationData {
	constructor(
		public readonly attribute_location: vscode.Range,
		public readonly attribute_line_number: number,
		public readonly document: vscode.Uri
	) {}
}
