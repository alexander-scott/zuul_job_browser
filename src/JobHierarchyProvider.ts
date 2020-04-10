import * as vscode from 'vscode';
import { FoodPyramid, FoodRelation } from './FoodPyramid';
import { JobPyramid } from './JobRelations';

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
		let model = parser.getFoodPyramidModel();
		let originRelation = model.getRelationAt(item.range);

		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];

		if (model.isVerb(item.name)) {
			let outgoingCalls = model.getVerbRelations(item.name)
				.filter(relation => relation.subject === originRelation!.subject);

			outgoingCalls.forEach(relation => {
				let outgoingCallRange = relation.getRangeOf(relation.object);
				let verbItem = this.createCallHierarchyItem(relation.object, 'noun', document, outgoingCallRange);
				let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(verbItem, [outgoingCallRange]);
				outgoingCallItems.push(outgoingCallItem);
			});
		}
		else if (model.isNoun(item.name)) {
			let outgoingCallMap = groupBy(model.getSubjectRelations(item.name), relation => relation.verb);

			outgoingCallMap.forEach((relations, verb) => {
				let outgoingCallRanges = relations.map(relation => relation.getRangeOf(verb));
				let verbItem = this.createCallHierarchyItem(verb, 'verb', document, outgoingCallRanges[0]);
				let outgoingCallItem = new vscode.CallHierarchyOutgoingCall(verbItem, outgoingCallRanges);
				outgoingCallItems.push(outgoingCallItem);
			});
		}

		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let parser = new JobHierarchyParser();
		parser.parse(document);
		let model = parser.getFoodPyramidModel();
		let originRelation = model.getRelationAt(item.range);

		let outgoingCallItems: vscode.CallHierarchyIncomingCall[] = [];

		if (model.isVerb(item.name)) {
			let outgoingCalls = model.getVerbRelations(item.name)
				.filter(relation => relation.object === originRelation!.object);

			outgoingCalls.forEach(relation => {
				let outgoingCallRange = relation.getRangeOf(relation.subject);
				let verbItem = this.createCallHierarchyItem(relation.subject, 'noun', document, outgoingCallRange);
				let outgoingCallItem = new vscode.CallHierarchyIncomingCall(verbItem, [outgoingCallRange]);
				outgoingCallItems.push(outgoingCallItem);
			});
		}
		else if (model.isNoun(item.name)) {
			let outgoingCallMap = groupBy(model.getObjectRelations(item.name), relation => relation.verb);

			outgoingCallMap.forEach((relations, verb) => {
				let outgoingCallRanges = relations.map(relation => relation.getRangeOf(verb));
				let verbItem = this.createCallHierarchyItem(verb, 'verb-inverted', document, outgoingCallRanges[0]);
				let outgoingCallItem = new vscode.CallHierarchyIncomingCall(verbItem, outgoingCallRanges);
				outgoingCallItems.push(outgoingCallItem);
			});
		}

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
		//this._parseJobHierarchy(textDocument);
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
		let job_parent_regex = /(?<=parent:).*/gm;
		let job_name = null;
		let parent_name = null;
		while (true) {
			job_line_number++;
			// Make sure we're not at the end of the document
			if (job_line_number > textDocument.lineCount) {
				break;
			}
			let line_text = textDocument.lineAt(job_line_number).text;
			// If this line is empty then we're at the end of the job
			if (!line_text) {
				break;
			}
			if (job_name_regex.exec(line_text)) {
				job_name = line_text.split(":").pop();
				//job_name = job_name.replace(/\s/g, "").toLowerCase();
				continue;
			}
			if (job_parent_regex.exec(line_text)) {
				parent_name = line_text.split(":").pop();
				continue;
			}
		}

		if (job_name !== null && parent_name !== null) {
			console.log("SUCCESS2: " + job_name + " -- " + parent_name);
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
