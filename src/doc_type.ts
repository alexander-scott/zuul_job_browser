import * as vscode from "vscode";
export class DocType {
	static is_a_project_template(textDocument: vscode.TextDocument): boolean {
		let proj_template_regex = /(?<=- project-template:).*/gm;
		if (proj_template_regex.exec(textDocument.getText())) {
			return true;
		}
		return false;
	}
}
