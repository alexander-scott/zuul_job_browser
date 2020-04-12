import * as vscode from "vscode";
import { Job } from "./job";

/**
 * Sample model of what the text in the document contains.
 */
export class JobManager {
	private _jobs: Job[] = [];

	/**
	 * Find a job at a specific location
	 */
	get_job_at(wordRange: vscode.Range): Job | undefined {
		return this._jobs.find((job) => job.job_name_location.contains(wordRange));
	}

	/**
	 * Add a new job to the array
	 */
	add_job(job: Job): void {
		let existing_jobs = this.get_a_single_job_with_name(job.job_name);
		if (existing_jobs.length == 0) {
			this._jobs.push(job);
		} else {
			console.log("DUPLICATE JOB ADD ATTEMPT!");
		}
	}

	/**
	 * Returns the single job with this name
	 */
	get_a_single_job_with_name(job_name: string): Job[] {
		return this._jobs.filter((job) => job.job_name === job_name);
	}

	get_parent_job(job_name: string): Job[] {
		let parent_name = this._jobs.filter((job) => job.job_name === job_name).pop()?.parent_name;

		return this._jobs.filter((job) => job.job_name === parent_name);
	}

	/**
	 * Returns all jobs which have this job as their parent
	 */
	get_all_child_jobs(job_name: string): Job[] {
		return this._jobs.filter((relation) => relation.parent_name === job_name);
	}
}
