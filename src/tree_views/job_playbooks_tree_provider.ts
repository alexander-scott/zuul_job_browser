import * as vscode from "vscode";
import { JobManager } from "../job_parsing/job_manager";
import { Job } from "../data_structures/job";
import { PlaybookCategoryItem, PlaybookItem } from "./job_tree_item";

type PlaybookTreeNode = PlaybookCategoryItem | PlaybookItem;

/**
 * Provides the playbook run order tree view.
 *
 * For the selected job, the Zuul playbook execution order is:
 *   Pre-Run  : ancestor → … → current job  (oldest ancestor first)
 *   Run      : most-specific job's run playbook
 *   Post-Run : current job → … → ancestor  (reverse of pre-run)
 */
export class JobPlaybooksTreeProvider implements vscode.TreeDataProvider<PlaybookTreeNode> {
	private _onDidChangeTreeData = new vscode.EventEmitter<PlaybookTreeNode | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private selectedJob: Job | undefined;
	private categories: PlaybookCategoryItem[] = [];

	constructor(private readonly job_manager: JobManager) {}

	/** Update the currently selected job and refresh the tree. */
	setSelectedJob(job: Job | undefined): void {
		this.selectedJob = job;
		this.buildCategories();
		this._onDidChangeTreeData.fire();
	}

	/** Rebuild without changing the selected job (e.g. after a re-parse). */
	refresh(): void {
		this.buildCategories();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PlaybookTreeNode): vscode.TreeItem {
		return element;
	}

	getChildren(element?: PlaybookTreeNode): vscode.ProviderResult<PlaybookTreeNode[]> {
		if (!element) {
			return this.categories;
		}
		if (element instanceof PlaybookCategoryItem) {
			return element.playbooks;
		}
		return [];
	}

	getParent(element: PlaybookTreeNode): vscode.ProviderResult<PlaybookTreeNode> {
		if (element instanceof PlaybookItem) {
			return this.categories.find((cat) => cat.playbooks.includes(element));
		}
		return undefined;
	}

	// ── private helpers ────────────────────────────────────────────────────────

	private buildCategories(): void {
		if (!this.selectedJob) {
			this.categories = [];
			return;
		}

		const ancestry = this.buildAncestryChain(this.selectedJob);
		const preRunItems: PlaybookItem[] = [];
		let runItems: PlaybookItem[] = [];
		const postRunItems: PlaybookItem[] = [];

		// Pre-run: ancestor → current (oldest first)
		for (const job of ancestry) {
			this.collectPlaybooks(job, "pre-run", preRunItems);
		}

		// Run: use the most specific (deepest) job's run playbook
		for (let i = ancestry.length - 1; i >= 0; i--) {
			const items: PlaybookItem[] = [];
			this.collectPlaybooks(ancestry[i], "run", items);
			if (items.length > 0) {
				runItems = items;
				break;
			}
		}

		// Post-run: current → ancestor (deepest first, reverse of pre-run)
		for (let i = ancestry.length - 1; i >= 0; i--) {
			this.collectPlaybooks(ancestry[i], "post-run", postRunItems);
		}

		this.categories = [
			new PlaybookCategoryItem("Pre-Run", preRunItems),
			new PlaybookCategoryItem("Run", runItems),
			new PlaybookCategoryItem("Post-Run", postRunItems),
		].filter((cat) => cat.playbooks.length > 0);
	}

	/** Returns the ancestry chain [root, ..., parent, job] (oldest first). */
	private buildAncestryChain(job: Job): Job[] {
		const chain: Job[] = [];
		const visited = new Set<string>();

		let current: Job | undefined = job;
		while (current) {
			const name = current.get_name_value();
			if (visited.has(name)) {break;}
			visited.add(name);
			chain.unshift(current);

			const parent_name = current.get_parent_value();
			current = parent_name ? this.job_manager.get_job_with_name(parent_name) : undefined;
		}
		return chain;
	}

	/**
	 * Collects PlaybookItems for a given phase (pre-run / run / post-run) from
	 * a single job's own attributes (not inherited).
	 */
	private collectPlaybooks(job: Job, phase: string, items: PlaybookItem[]): void {
		const attrs = job.get_all_attributes_with_values();
		for (const key of Object.keys(attrs)) {
			if (key === phase || key.startsWith(phase + ".")) {
				const playbook_path = attrs[key];
				let range: vscode.Range;
				try {
					range = job.get_location_of_value(playbook_path).get_as_vscode_location();
				} catch {
					range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
				}
				items.push(new PlaybookItem(playbook_path, job.get_name_value(), job.document, range));
			}
		}
	}
}
