import * as vscode from "vscode";

/**
 * A tree item representing a Zuul job in the hierarchy tree view.
 */
export class JobTreeItem extends vscode.TreeItem {
	constructor(
		public readonly jobName: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly document: vscode.Uri,
		public readonly range: vscode.Range
	) {
		super(jobName, collapsibleState);
		this.tooltip = jobName;
		this.iconPath = new vscode.ThemeIcon("symbol-class");
		this.command = {
			command: "symbolOutline.revealRange",
			title: "Reveal Range",
			arguments: [document, range],
		};
	}
}

/**
 * A tree item representing a playbook phase category (Pre-Run, Run, Post-Run).
 */
export class PlaybookCategoryItem extends vscode.TreeItem {
	constructor(
		public readonly phase: string,
		public readonly playbooks: PlaybookItem[]
	) {
		super(phase, vscode.TreeItemCollapsibleState.Expanded);
		this.description = `${playbooks.length} playbook(s)`;
		this.iconPath = new vscode.ThemeIcon("run-all");
	}
}

/**
 * A tree item representing a single playbook in the run order tree view.
 */
export class PlaybookItem extends vscode.TreeItem {
	constructor(
		public readonly playbookPath: string,
		public readonly jobName: string,
		public readonly document: vscode.Uri,
		public readonly range: vscode.Range
	) {
		super(playbookPath, vscode.TreeItemCollapsibleState.None);
		this.description = `from ${jobName}`;
		this.tooltip = `${playbookPath} (defined in ${jobName})`;
		this.iconPath = new vscode.ThemeIcon("file-code");
		this.command = {
			command: "symbolOutline.revealRange",
			title: "Reveal Range",
			arguments: [document, range],
		};
	}
}

/**
 * A tree item representing a job that owns variables in the variables tree view.
 */
export class VariableJobItem extends vscode.TreeItem {
	constructor(
		public readonly jobName: string,
		public readonly variables: VariableItem[],
		public readonly document: vscode.Uri,
		public readonly range: vscode.Range
	) {
		super(jobName, vscode.TreeItemCollapsibleState.Expanded);
		this.description = `${variables.length} variable(s)`;
		this.iconPath = new vscode.ThemeIcon("symbol-class");
		this.command = {
			command: "symbolOutline.revealRange",
			title: "Reveal Range",
			arguments: [document, range],
		};
	}
}

/**
 * A tree item representing a single job variable in the variables tree view.
 */
export class VariableItem extends vscode.TreeItem {
	constructor(
		public readonly variableName: string,
		public readonly variableValue: string,
		public readonly document: vscode.Uri,
		public readonly range: vscode.Range
	) {
		super(variableName, vscode.TreeItemCollapsibleState.None);
		this.description = String(variableValue);
		this.tooltip = `${variableName}: ${variableValue}`;
		this.iconPath = new vscode.ThemeIcon("symbol-variable");
		this.command = {
			command: "symbolOutline.revealRange",
			title: "Reveal Range",
			arguments: [document, range],
		};
	}
}
