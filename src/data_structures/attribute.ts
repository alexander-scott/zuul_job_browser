import * as vscode from "vscode";

export class Attribute {
	public attribute_location!: vscode.Range;
	public attribute_line_number!: number;
	public document!: vscode.Uri;

	constructor(public readonly attribute_key: string, public readonly attribute_value: Attribute[] | string) {}

	set_location(attribute_location: vscode.Range, attribute_line_number: number, document: vscode.Uri) {
		this.attribute_location = attribute_location;
		this.attribute_line_number = attribute_line_number;
		this.document = document;
	}
}
