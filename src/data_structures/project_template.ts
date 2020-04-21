import * as vscode from "vscode";
import { Attribute } from "./attribute";

export class ProjectTemplate {
	private attributes: Attribute[] = [];

	constructor(public readonly document: vscode.Uri) {}

	add_attribute(attribute: Attribute) {
		this.attributes.push(attribute);
	}
}
