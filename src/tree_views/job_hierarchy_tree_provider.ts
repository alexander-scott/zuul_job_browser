import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { Job } from "../data_structures/job";
import { JobTreeItem } from "./job_tree_item";

/**
 * Provides the job hierarchy tree view, showing all known jobs in a parent/child
 * tree structure. The currently selected job can be revealed via treeView.reveal().
 */
export class JobHierarchyTreeProvider implements vscode.TreeDataProvider<JobTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<JobTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	/** Cache of job name → tree item so that reveal() can use the same object instances. */
	private itemCache = new Map<string, JobTreeItem>();

	constructor(private readonly job_manager: JobManager) {
		this.populateCache();
	}

	/** Clears the item cache and refreshes the tree. Call when jobs are re-parsed. */
	refresh(): void {
		this.itemCache.clear();
		this.populateCache();
		this._onDidChangeTreeData.fire();
	}

	/**
	 * Returns the cached tree item for the given job name, or undefined if not found.
	 * Used by the selection listener in extension.ts to call treeView.reveal().
	 */
	getJobTreeItem(jobName: string): JobTreeItem | undefined {
		return this.itemCache.get(jobName);
	}

	getTreeItem(element: JobTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: JobTreeItem): vscode.ProviderResult<JobTreeItem[]> {
		if (!element) {
			// Root level: jobs whose parent is unknown (not in the parsed set)
			return this.job_manager
				.get_all_jobs()
				.filter((job) => {
					const parent = job.get_parent_value();
					if (!parent) {return true;}
					return !this.job_manager.get_job_with_name(parent);
				})
				.map((job) => this.getOrCreateJobTreeItem(job));
		}
		return this.job_manager
			.get_all_jobs_with_this_parent(element.jobName)
			.map((job) => this.getOrCreateJobTreeItem(job));
	}

	getParent(element: JobTreeItem): vscode.ProviderResult<JobTreeItem> {
		const job = this.job_manager.get_job_with_name(element.jobName);
		if (!job) {return undefined;}
		const parent_name = job.get_parent_value();
		if (!parent_name) {return undefined;}
		const parent_job = this.job_manager.get_job_with_name(parent_name);
		if (!parent_job) {return undefined;}
		return this.getOrCreateJobTreeItem(parent_job);
	}

	/** Eagerly populate the item cache so reveal() works without prior tree expansion. */
	private populateCache(): void {
		this.job_manager.get_all_jobs().forEach((job) => this.getOrCreateJobTreeItem(job));
	}

	private getOrCreateJobTreeItem(job: Job): JobTreeItem {
		const job_name = job.get_name_value();
		const cached = this.itemCache.get(job_name);
		if (cached) {return cached;}

		const has_children = this.job_manager.get_all_jobs_with_this_parent(job_name).length > 0;
		const collapsibleState = has_children
			? vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None;

		let range: vscode.Range;
		try {
			range = job.get_location_of_value(job_name).get_as_vscode_location();
		} catch {
			range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
		}

		const item = new JobTreeItem(job_name, collapsibleState, job.document, range);
		this.itemCache.set(job_name, item);
		return item;
	}
}
