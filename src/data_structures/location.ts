import * as vscode from "vscode";

export class Location {
	constructor(
		public readonly value: string,
		public readonly line_number: number,
		public readonly line_indentation: number,
		public readonly vscode_location: vscode.Range
	) {}
}
