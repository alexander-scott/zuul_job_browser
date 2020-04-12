import * as vscode from "vscode";
import { JobHierarchyParser } from "./job_hierarchy_parser";
import { JobParser } from "./job_parser";

/* TODO:
- In prepareCallHierarchy() check if the current position is within a job. If so highlight the name.
- Refactor variables + naming
- Apply across multiple files.

*/

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {
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
	): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobManager();

		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];
		let outgoingCalls = model.get_parent_job(item.name);

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
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobManager();

		let incomingCallItems: vscode.CallHierarchyIncomingCall[] = [];
		let incomingCalls = model.get_all_child_jobs(item.name);

		incomingCalls.forEach((job) => {
			let outgoingCallRange = job.job_name_location;
			let child_job = this.createCallHierarchyItem(job.job_name, "child", job.document, outgoingCallRange);
			let outgoingCallItem = new vscode.CallHierarchyIncomingCall(child_job, [outgoingCallRange]);
			incomingCallItems.push(outgoingCallItem);
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
