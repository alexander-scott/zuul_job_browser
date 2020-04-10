import * as vscode from 'vscode';

/**
 * Sample model of what the text in the document contains.
 */
export class JobPyramid {
    private _relations: JobRelation[] = [];
    private _jobs = new Set<string>();

    getRelationAt(wordRange: vscode.Range): JobRelation | undefined {
        return this._relations.find(relation => relation.job_name_location.contains(wordRange));
    }

    addRelation(relation: JobRelation): void {
        this._relations.push(relation);
        this._jobs.add(relation.jobName).add(relation.parentName);
    }

    isJob(name: string): boolean {
        return this._jobs.has(name.toLowerCase());
    }

    /**
     * Returns the single job with this name
     */
    get_parent_job(job_name: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.jobName === job_name.toLowerCase());
    }

    getAllJobRelations(job: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.involves(job));
    }

    /**
     * Returns all jobs which have this job as their parent
     */
    get_child_jobs_of_parent(parent_job: string): JobRelation[] {
        return this._relations
            .filter(relation => relation.parentName === parent_job);
    }
}

/**
 * Model element.
 */
export class JobRelation {
    private _jobName: string;
    private _parentName: string;

    constructor(jobName: string, parentName: string,
        private readonly originalText: string, public readonly job_name_location: vscode.Range, public readonly parent_name_location: vscode.Range) {

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
        return this.job_name_location;
        let indexOfWord = new RegExp("(?<=" + word + ".*", "i").exec(this.originalText)!.index;
        return new vscode.Range(this.job_name_location.start.translate({ characterDelta: indexOfWord }),
            this.job_name_location.start.translate({ characterDelta: indexOfWord + word.length }));
    }
}
