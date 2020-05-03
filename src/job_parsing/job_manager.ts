import * as vscode from "vscode";
import { Logger } from "../file_parsing/logger";
import { Job } from "../data_structures/job";

/**
 * Holds all the parsed jobs and offers useful helpful functions.
 */
export class JobManager {
	private _jobs: Job[] = [];

	/**
	 * Add a new job to the array
	 * @param Job The job to add to the array of jobs
	 */
	add_job(job: Job): void {
		let job_name = job.get_name_value();
		let existing_jobs = this.get_all_jobs_with_name(job_name);
		if (existing_jobs.length === 0) {
			this._jobs.push(job);
		} else {
			Logger.getInstance().debug("DUPLICATE JOB ADD ATTEMPT!");
		}
	}

	remove_all_jobs(): void {
		this._jobs = [];
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		this._jobs = this._jobs.filter((job) => job.document.path !== uri.path);
	}

	get_all_jobs(): Job[] {
		return this._jobs;
	}

	get_all_jobs_in_document(uri: vscode.Uri): Job[] {
		return this._jobs.filter((job) => job.document.path === uri.path);
	}

	/**
	 * Find a job at a specific location in a document.
	 */
	get_job_at(wordRange: vscode.Range): Job | undefined {
		return this._jobs.find((job) =>
			job.get_all_value_locations().find((loc) => loc.vscode_location.contains(wordRange))
		);
	}

	/**
	 * Finds the job called job_name and then finds it's parent job.
	 * @param string job_name
	 */
	get_parent_job_from_job_name(job_name: string): Job | undefined {
		let job = this.get_job_with_name(job_name);
		if (!job) return undefined;

		let parent_name = job.get_parent_value();
		if (!parent_name) return undefined;

		let parent_job = this.get_job_with_name(parent_name);
		return parent_job;
	}

	/**
	 * Returns a single job which has job_name as their name.
	 * @param string job_name
	 */
	get_job_with_name(job_name: string): Job | undefined {
		return this._jobs.find((job) => job.get_name_value() === job_name);
	}

	/**
	 * Returns all the jobs which have job_name as their name. In most cases, this should just be a single job.
	 * @param string job_name
	 */
	get_all_jobs_with_name(job_name: string): Job[] {
		return this._jobs.filter((job) => job.get_name_value() === job_name);
	}

	/**
	 * Returns all jobs which have job_name as their parent
	 * @param string job_name
	 */
	get_all_jobs_with_this_parent(job_name: string): Job[] {
		return this._jobs.filter((job) => job.get_parent_value() !== undefined && job.get_parent_value() === job_name);
	}

	/**
	 * Returns the total number of jobs that have been parsed.
	 */
	get_total_jobs_parsed(): number {
		return this._jobs.length;
	}
}
