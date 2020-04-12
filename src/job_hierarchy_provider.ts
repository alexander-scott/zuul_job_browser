import * as vscode from 'vscode';
import { JobHierarchyParser } from './job_hierarchy_parser';
import { Job } from './job';

/* TODO:
- In prepareCallHierarchy() check if the current position is within a job. If so highlight the name.
- Refactor variables + naming
- Apply across multiple files.

*/

export class JobHierarchyProvider implements vscode.CallHierarchyProvider {

	prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CallHierarchyItem | undefined {
		let range = document.getWordRangeAtPosition(position);
		if (range) {
			let job = this._parseInitialJob(document, position.line);
			if (job)
				return this.createCallHierarchyItem(job.job_name, 'job', document, job.job_name_location);
		}
		return undefined;
	}

	_parseInitialJob(textDocument: vscode.TextDocument, job_line_number: number): Job | undefined {
		let job_name_regex = /(?<=name:).*/gm;
		let job_name = null;
		let job_name_location = null;
		let job_parent_regex = /(?<=parent:).*/gm;
		let parent_name = null;
		let parent_name_location = null;

		let line_iterator = job_line_number;

		// From the current line, search downwards.
		while (true) {
			// Make sure we're not at the end of the document
			if (line_iterator >= textDocument.lineCount) {
				break;
			}
			let line = textDocument.lineAt(line_iterator);
			let line_text = line.text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (job_name_regex.exec(line_text)) {
				job_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (job_parent_regex.exec(line_text)) {
				parent_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_iterator++;
		}

		if (job_name !== null && job_name !== undefined && parent_name !== null && parent_name !== undefined && job_name_location !== null && parent_name_location !== null) {
			console.log("SUCCESS3: " + job_name + " -- " + parent_name);
			return new Job(job_name_location.text, job_name, parent_name, job_name_location.range, parent_name_location.range);
		}

		line_iterator = job_line_number;

		// From the current line, search upwards.
		while (true) {
			// Make sure we're not at the end of the document
			if (line_iterator <= 0) {
				break;
			}
			let line = textDocument.lineAt(line_iterator);
			let line_text = line.text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (job_name_regex.exec(line_text)) {
				job_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				job_name_location = line;
				continue;
			}
			if (job_parent_regex.exec(line_text)) {
				parent_name = line_text.replace(/\s/g, "").toLowerCase().split(":").pop();
				parent_name_location = line;
				continue;
			}
			line_iterator--;
		}

		if (job_name !== null && job_name !== undefined && parent_name !== null && parent_name !== undefined && job_name_location !== null && parent_name_location !== null) {
			console.log("SUCCESS3: " + job_name + " -- " + parent_name);
			return new Job(job_name_location.text, job_name, parent_name, job_name_location.range, parent_name_location.range);
		}

		return undefined;
	}

	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobManager();
		let originRelation = model.get_job_at(item.range);

		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];

		// In this function we want to list all the jobs which have this job as their parent.

		let outgoingCalls = model.get_all_jobs_where_name_is_parent(item.name);

		outgoingCalls.forEach(job => {
			let outgoingCallRange = job.job_name_location;
			let verbItem = this.createCallHierarchyItem(job.job_name, 'child', document, outgoingCallRange);
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

		let outgoingCalls = model.get_parent_from_job(item.name);

		outgoingCalls.forEach(relation => {
			let outgoingCallRange = relation.job_name_location;
			let verbItem = this.createCallHierarchyItem(relation.job_name, 'parent', document, outgoingCallRange);
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
