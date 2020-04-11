import * as vscode from 'vscode';
import { Job } from './job';

/**
 * Sample model of what the text in the document contains.
 */
export class JobManager {
    private _jobs: Job[] = [];

    /**
     * Find a job at a specific location
     */
    get_job_at(wordRange: vscode.Range): Job | undefined {
        return this._jobs.find(job => job.job_name_location.contains(wordRange));
    }

    /**
     * Add a new job to the array
     */
    add_job(job: Job): void {
        this._jobs.push(job);
    }

    /**
     * Returns the single job with this name
     */
    get_a_single_job_with_name(job_name: string): Job[] {
        return this._jobs
            .filter(job => job.job_name === job_name);
    }

    // getAllJobRelations(job: string): Job[] {
    //     return this._jobs
    //         .filter(relation => relation.involves(job));
    // }

    /**
     * Returns all jobs which have this job as their parent
     */
    get_all_jobs_where_name_is_parent(job_name: string): Job[] {
        return this._jobs
            .filter(relation => relation.parent_name === job_name);
    }
}
