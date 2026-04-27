import * as vscode from "vscode";
import { Type } from "class-transformer";

export class Location {
	@Type(() => vscode.Uri)
	public readonly document: vscode.Uri;
	@Type(() => vscode.Position)
	public readonly startPosition: vscode.Position;
	@Type(() => vscode.Position)
	public readonly endPosition: vscode.Position;

	constructor(
		public readonly value: string,
		public readonly line_number: number,
		public readonly line_indentation: number,
		startPosition: vscode.Position,
		endPosition: vscode.Position,
		document: vscode.Uri
	) {
		this.startPosition = startPosition;
		this.endPosition = endPosition;
		this.document = document;
	}

	get_as_vscode_location(): vscode.Range {
		return new vscode.Range(this.startPosition, this.endPosition);
	}
}
