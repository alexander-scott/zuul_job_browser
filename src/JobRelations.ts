import * as vscode from 'vscode';

/**
 * Sample model of what the text in the document contains.
 */
export class JobPyramid {
    private _relations: JobRelation[] = [];
    private _jobs = new Set<string>();

    getRelationAt(wordRange: vscode.Range): JobRelation | undefined {
        return this._relations.find(relation => relation.range.contains(wordRange));
    }

    addRelation(relation: JobRelation): void {
        this._relations.push(relation);
        this._jobs.add(relation.jobName).add(relation.parentName);
    }

    isVerb(name: string): boolean {
        return this._jobs.has(name.toLowerCase());
    }


    getChildJobRelations(job: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.jobName === job.toLowerCase());
    }

    getAllJobRelations(job: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.involves(job));
    }

    getParentJobRelations(parent: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.parentName === parent.toLowerCase());
    }
}

/**
 * Model element.
 */
export class JobRelation {
    private _jobName: string;
    private _parentName: string;

    constructor(jobName: string, parentName: string,
        private readonly originalText: string, public readonly range: vscode.Range) {

        this._jobName = jobName;
        this._parentName = parentName;
    }

    get jobName(): string {
        return this._jobName;
    }

    get parentName(): string {
        return this._parentName;
    }

    involves(noun: string): boolean {
        let needle = noun.toLowerCase();
        return this._jobName === needle || this._parentName === needle;
    }

    getRangeOf(word: string): vscode.Range {
        let indexOfWord = new RegExp("\\b" + word + "\\b", "i").exec(this.originalText)!.index;
        return new vscode.Range(this.range.start.translate({ characterDelta: indexOfWord }),
            this.range.start.translate({ characterDelta: indexOfWord + word.length }));
    }
}
