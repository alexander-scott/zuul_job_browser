import * as vscode from 'vscode';
import { FoodPyramid, FoodRelation } from './FoodPyramid';
import { JobPyramid, JobRelation } from './JobRelations';

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
		let model = parser.getJobPyramidModel();
		let originRelation = model.getRelationAt(item.range);

		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];

		// In this function we want to list all the jobs which have this job as their parent.

		let outgoingCalls = model.get_child_jobs_of_parent(" test-job-3");

		outgoingCalls.forEach(relation => {
			let outgoingCallRange = relation.getRangeOf(relation.jobName);
			let verbItem = this.createCallHierarchyItem(relation.jobName, 'job', document, outgoingCallRange);
			let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(verbItem, [outgoingCallRange]);
			outgoingCallItems.push(outgoingCallItem);
		});

		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getJobPyramidModel();
		let originRelation = model.getRelationAt(item.range);

		let outgoingCallItems: vscode.CallHierarchyIncomingCall[] = [];

		let outgoingCalls = model.get_parent_job(item.name);

		outgoingCalls.forEach(relation => {
			let outgoingCallRange = relation.getRangeOf(relation.jobName);
			let verbItem = this.createCallHierarchyItem(relation.jobName, 'job', document, outgoingCallRange);
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
 * Sample parser of the document text into the [FoodPyramid](#FoodPyramid) model.
 */
class JobHierarchyParser {
	private _foodPyramidModel = new FoodPyramid();
	private _jobPyramidModel = new JobPyramid();

	getFoodPyramidModel(): FoodPyramid {
		return this._foodPyramidModel;
	}

	getJobPyramidModel(): JobPyramid {
		return this._jobPyramidModel;
	}

	parse(textDocument: vscode.TextDocument): void {
		this._parseJobHierarchy(textDocument);
		this._parseFoodPyramid(textDocument);
	}

	_parseFoodPyramid(textDocument: vscode.TextDocument): void {
		let pattern = /^(\w+)\s+(\w+)\s+(\w+).$/gm;
		let match: RegExpExecArray | null;
		while (match = pattern.exec(textDocument.getText())) {
			let startPosition = textDocument.positionAt(match.index);
			let range = new vscode.Range(startPosition, startPosition.translate({ characterDelta: match[0].length }));
			this._foodPyramidModel.addRelation(new FoodRelation(match[1], match[2], match[3], match[0], range));
		}
	}

	_parseJobHierarchy(textDocument: vscode.TextDocument): void {
		let job_regex = /^- job:/gm;
		let match: RegExpExecArray | null;
		while (match = job_regex.exec(textDocument.getText())) {
			let line_number = textDocument.positionAt(match.index).line;
			this._parseIndividualJob(textDocument, line_number);
		}
	}

	_parseIndividualJob(textDocument: vscode.TextDocument, job_line_number: number): void {
		let job_name_regex = /(?<=name:).*/gm;
		let job_name = null;
		let job_name_location = null;
		let job_parent_regex = /(?<=parent:).*/gm;
		let parent_name = null;
		let parent_name_location = null;

		while (true) {
			job_line_number++;
			// Make sure we're not at the end of the document
			if (job_line_number >= textDocument.lineCount) {
				break;
			}
			let line = textDocument.lineAt(job_line_number);
			let line_text = line.text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (job_name_regex.exec(line_text)) {
				job_name = line_text.split(":").pop();
				//job_name = job_name.replace(/\s/g, "").toLowerCase();
				job_name_location = line;
				continue;
			}
			if (job_parent_regex.exec(line_text)) {
				parent_name = line_text.split(":").pop();
				parent_name_location = line;
				continue;
			}
		}

		if (job_name !== null && job_name !== undefined && parent_name !== null && parent_name !== undefined && job_name_location !== null && parent_name_location !== null) {
			console.log("SUCCESS2: " + job_name + " -- " + parent_name);
			this._jobPyramidModel.addRelation(new JobRelation(job_name, parent_name, job_name_location.text, job_name_location.range, parent_name_location.range));
		}
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
