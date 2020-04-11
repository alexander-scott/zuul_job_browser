import * as vscode from 'vscode';
import { JobHierarchyParser } from './job_hierarchy_parser';

/* TODO:
- In prepareCallHierarchy() check if the current position is within a job. If so highlight the name.
- Refactor variables + naming
- Apply across multiple files.

*/

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {

	prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CallHierarchyItem | undefined {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let word = document.getText(range);
			return this.createCallHierarchyItem(word, '', document, range);
		} else {
			return undefined;
		}
	}

	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobManager();
		let originRelation = model.get_job_at(item.range);

		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];

		// In this function we want to list all the jobs which have this job as their parent.

		let outgoingCalls = model.get_all_jobs_where_name_is_parent("test-job-3");

		outgoingCalls.forEach(job => {
			let outgoingCallRange = job.job_name_location;
			let verbItem = this.createCallHierarchyItem(job.job_name, 'job', document, outgoingCallRange);
			let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(verbItem, [outgoingCallRange]);
			outgoingCallItems.push(outgoingCallItem);
		});

		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobManager();
		let originRelation = model.get_job_at(item.range);

		let outgoingCallItems: vscode.CallHierarchyIncomingCall[] = [];

		let outgoingCalls = model.get_a_single_job_with_name(item.name);

		outgoingCalls.forEach(relation => {
			let outgoingCallRange = relation.job_name_location;
			let verbItem = this.createCallHierarchyItem(relation.job_name, 'job', document, outgoingCallRange);
			let outgoingCallItem = new vscode.CallHierarchyIncomingCall(verbItem, [outgoingCallRange]);
			outgoingCallItems.push(outgoingCallItem);
		});

		return outgoingCallItems;
	}

	private createCallHierarchyItem(word: string, type: string, document: vscode.TextDocument, range: vscode.Range): vscode.CallHierarchyItem {
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
