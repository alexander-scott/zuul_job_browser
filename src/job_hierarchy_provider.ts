import * as vscode from "vscode";
import { JobParser } from "./job_parser";
import { JobManager } from "./job_manager";

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
		this.job_manager = job_manager;
	}

	prepareCallHierarchy(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.CallHierarchyItem | undefined {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Find the closest job from where the user has selected
			let job = new JobParser().parse_job_from_line_number(document, position.line);
			// Highlight the job name
			if (job) return this.createCallHierarchyItem(job.job_name, "job", document, job.job_name_location);
		}
		return undefined;
	}

	async provideCallHierarchyOutgoingCalls(
		item: vscode.CallHierarchyItem,
		token: vscode.CancellationToken
	): Promise<vscode.CallHierarchyOutgoingCall[]> {
		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];
		let outgoingCalls = this.job_manager.get_parent_job(item.name);

		outgoingCalls.forEach((job) => {
			let outgoingCallRange = job.job_name_location;
			let parent_job = this.createCallHierarchyItem(job.job_name, "parent", job.document, outgoingCallRange);
			let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(parent_job, [outgoingCallRange]);
			outgoingCallItems.push(outgoingCallItem);
		});

		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(
		item: vscode.CallHierarchyItem,
		token: vscode.CancellationToken
	): Promise<vscode.CallHierarchyIncomingCall[]> {
		let incomingCallItems: vscode.CallHierarchyIncomingCall[] = [];
		let incomingCalls = this.job_manager.get_all_child_jobs(item.name);

		incomingCalls.forEach((job) => {
			let incomingCallRange = job.job_name_location;
			let child_job = this.createCallHierarchyItem(job.job_name, "child", job.document, incomingCallRange);
			let incomingCallItem = new vscode.CallHierarchyIncomingCall(child_job, [incomingCallRange]);
			incomingCallItems.push(incomingCallItem);
		});

		return incomingCallItems;
	}

	private createCallHierarchyItem(
		word: string,
		type: string,
		document: vscode.TextDocument,
		range: vscode.Range
	): vscode.CallHierarchyItem {
		return new vscode.CallHierarchyItem(vscode.SymbolKind.Object, word, `(${type})`, document.uri, range, range);
	}
}

/**
 * Groups array items by a field defined using a key selector.
 * @param array array to be grouped
 * @param keyGetter grouping key selector
 */
function groupBy<K, V>(array: Array<V>, keyGetter: (value: V) => K): Map<K, V[]> {
	const map = new Map();
	array.forEach((item) => {
		const key = keyGetter(item);
		const groupForKey = map.get(key) || [];
		groupForKey.push(item);
		map.set(key, groupForKey);
	});
	return map;
}
