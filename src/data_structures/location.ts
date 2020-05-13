import * as vscode from "vscode";
import { Type } from "class-transformer";
import { throws } from "assert";

export class Location {
	@Type(() => vscode.Uri)
	public readonly document: vscode.Uri;
	@Type(() => vscode.Position)
	public readonly start_pos: vscode.Position;
	@Type(() => vscode.Position)
	public readonly end_pos: vscode.Position;

	constructor(
		public readonly value: string,
		public readonly line_number: number,
		public readonly line_indentation: number,
		start_pos: vscode.Position,
		end_pos: vscode.Position,
		document: vscode.Uri
	) {
		this.start_pos = start_pos;
		this.end_pos = end_pos;
		this.document = document;
	}

	get_as_vscode_location(): vscode.Range {
		return new vscode.Range(this.start_pos, this.end_pos);
	}
}
