import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobDefinitionManager } from "../job_parsing/job_definition_manager";

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {
	private job_manager = new JobDefinitionManager();

	constructor(job_manager: JobDefinitionManager) {
		this.job_manager = job_manager;
	}

	prepareCallHierarchy(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.CallHierarchyItem | undefined {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			// Find the closest job from where the user has selected
			let job_name = new JobParser().parse_job_from_line_number(document, position.line);
			// Highlight the job name
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let job_name = job.get_job_name_attribute();
					return this.createCallHierarchyItem(
						job_name.attribute_value as string,
						"job",
						document.uri,
						job_name.attribute_location
					);
				}
			}
		}
		return undefined;
	}

	async provideCallHierarchyOutgoingCalls(
		item: vscode.CallHierarchyItem,
		_token: vscode.CancellationToken
	): Promise<vscode.CallHierarchyOutgoingCall[]> {
		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];
		let parent_job = this.job_manager.get_parent_job_from_job_name(item.name);
		if (parent_job) {
			let job_name = parent_job.get_job_name_attribute();
			let parent_job_call = this.createCallHierarchyItem(
				job_name.attribute_value as string,
				"parent",
				job_name.document,
				job_name.attribute_location
			);
			let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(parent_job_call, [job_name.attribute_location]);
			outgoingCallItems.push(outgoingCallItem);
		}

		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(
		item: vscode.CallHierarchyItem,
		_token: vscode.CancellationToken
	): Promise<vscode.CallHierarchyIncomingCall[]> {
		let incomingCallItems: vscode.CallHierarchyIncomingCall[] = [];
		let incomingCalls = this.job_manager.get_all_jobs_with_this_parent(item.name);

		incomingCalls.forEach((job) => {
			let job_name = job.get_job_name_attribute();
			let child_job = this.createCallHierarchyItem(
				job_name.attribute_value as string,
				"child",
				job_name.document,
				job_name.attribute_location
			);
			let incomingCallItem = new vscode.CallHierarchyIncomingCall(child_job, [job_name.attribute_location]);
			incomingCallItems.push(incomingCallItem);
		});

		return incomingCallItems;
	}

	private createCallHierarchyItem(
		word: string,
		type: string,
		document: vscode.Uri,
		range: vscode.Range
	): vscode.CallHierarchyItem {
		return new vscode.CallHierarchyItem(vscode.SymbolKind.Object, word, `(${type})`, document, range, range);
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
