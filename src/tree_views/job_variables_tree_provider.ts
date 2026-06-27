import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { Job } from "../data_structures/job";
import { JobAttributeCollector } from "../job_parsing/job_attribute_collector";
import { VariableJobItem, VariableItem } from "./job_tree_item";

type VariableTreeNode = VariableJobItem | VariableItem;

/**
 * Provides the "All Job Variables" tree view.
 *
 * For the selected job, all attributes (including inherited ones) are collected
 * via JobAttributeCollector and grouped by the job that originally defines them.
 * Each source-job group is a collapsible node; each attribute is a leaf node.
 */
export class JobVariablesTreeProvider implements vscode.TreeDataProvider<VariableTreeNode> {
	private _onDidChangeTreeData = new vscode.EventEmitter<VariableTreeNode | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private selectedJob: Job | undefined;
	private jobGroups: VariableJobItem[] = [];

	constructor(private readonly job_manager: JobManager) {}

	/** Update the currently selected job and refresh the tree. */
	setSelectedJob(job: Job | undefined): void {
		this.selectedJob = job;
		this.buildJobGroups();
		this._onDidChangeTreeData.fire();
	}

	/** Rebuild without changing the selected job (e.g. after a re-parse). */
	refresh(): void {
		this.buildJobGroups();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: VariableTreeNode): vscode.TreeItem {
		return element;
	}

	getChildren(element?: VariableTreeNode): vscode.ProviderResult<VariableTreeNode[]> {
		if (!element) {
			return this.jobGroups;
		}
		if (element instanceof VariableJobItem) {
			return element.variables;
		}
		return [];
	}

	getParent(element: VariableTreeNode): vscode.ProviderResult<VariableTreeNode> {
		if (element instanceof VariableItem) {
			return this.jobGroups.find((jg) => jg.variables.includes(element));
		}
		return undefined;
	}

	// ── private helpers ────────────────────────────────────────────────────────

	private buildJobGroups(): void {
		if (!this.selectedJob) {
			this.jobGroups = [];
			return;
		}

		const attributes = JobAttributeCollector.get_attributes_for_job(this.selectedJob, this.job_manager);

		// Group variable items by the job that defines them, preserving definition order.
		const groupMap = new Map<string, VariableItem[]>();

		for (const [key, attr] of Object.entries(attributes)) {
			const source_job = this.job_manager.get_job_with_name(attr.job_name);
			if (!source_job) {continue;}

			// Navigate to the attribute key location first; fall back to the value location.
			let range: vscode.Range;
			try {
				const key_tail = key.split(".").pop() ?? key;
				range = source_job.get_location_of_value(key_tail).get_as_vscode_location();
			} catch {
				try {
					range = source_job.get_location_of_value(String(attr.value)).get_as_vscode_location();
				} catch {
					range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
				}
			}

			if (!groupMap.has(attr.job_name)) {
				groupMap.set(attr.job_name, []);
			}
			groupMap.get(attr.job_name)!.push(new VariableItem(key, String(attr.value), source_job.document, range));
		}

		// Build VariableJobItem for each group.
		this.jobGroups = [];
		for (const [jobName, variables] of groupMap) {
			const job = this.job_manager.get_job_with_name(jobName);
			if (!job) {continue;}

			let jobRange: vscode.Range;
			try {
				jobRange = job.get_location_of_value(jobName).get_as_vscode_location();
			} catch {
				jobRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
			}

			this.jobGroups.push(new VariableJobItem(jobName, variables, job.document, jobRange));
		}
	}
}
