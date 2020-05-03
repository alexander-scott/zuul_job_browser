import * as vscode from "vscode";
import { JobParser } from "../job_parsing/job_parser";
import { JobManager } from "../job_parsing/job_manager";

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {
	private job_manager = new JobManager();

	constructor(job_manager: JobManager) {
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
			let job_name = JobParser.parse_job_from_random_line_number(document, position.line);
			// Highlight the job name
			if (job_name) {
				let job = this.job_manager.get_job_with_name(job_name);
				if (job) {
					let job_name = job.get_name_value();
					let job_name_location = job.get_location_of_value(job_name);
					return this.createCallHierarchyItem(job_name, "job", document.uri, job_name_location.vscode_location);
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
			let job_name = parent_job.get_name_value();
			let job_name_location = parent_job.get_location_of_value(job_name);
			let parent_job_call = this.createCallHierarchyItem(
				job_name,
				"parent",
				parent_job.document,
				job_name_location.vscode_location
			);
			let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(parent_job_call, [job_name_location.vscode_location]);
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
			let job_name = job.get_name_value();
			let job_name_location = job.get_location_of_value(job_name);
			let child_job = this.createCallHierarchyItem(
				job_name as string,
				"child",
				job.document,
				job_name_location.vscode_location
			);
			let incomingCallItem = new vscode.CallHierarchyIncomingCall(child_job, [job_name_location.vscode_location]);
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
