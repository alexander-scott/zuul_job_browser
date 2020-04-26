import * as vscode from "vscode";
import { Job } from "../data_structures/job";
import { Logger } from "../file_parsing/logger";

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
		let job_name = job.get_all_top_level_attributes().find((att) => att.key === "name")?.value;
		if (!job_name || typeof job_name !== "string") {
			Logger.getInstance().debug("Job doesn't have a name?!?!");
			return;
		}
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
			job.get_all_top_level_attributes().find((att) => att.location.range.contains(wordRange))
		);
	}

	/**
	 * Finds the job called job_name and then finds it's parent job.
	 * @param string job_name
	 */
	get_parent_job_from_job_name(job_name: string): Job | undefined {
		let parent_name = this._jobs
			.find((job) => job.get_all_top_level_attributes().find((att) => att.value === job_name && att.key === "name"))
			?.get_all_top_level_attributes()
			.find((att) => att.key === "parent")?.value;

		if (parent_name && typeof parent_name === "string") {
			return this.get_job_with_name(parent_name);
		}
		return undefined;
	}

	/**
	 * Returns a single job which has job_name as their name.
	 * @param string job_name
	 */
	get_job_with_name(job_name: string): Job | undefined {
		return this._jobs.find((job) =>
			job.get_all_top_level_attributes().find((att) => att.value === job_name && att.key === "name")
		);
	}

	/**
	 * Returns all the jobs which have job_name as their name. In most cases, this should just be a single job.
	 * @param string job_name
	 */
	get_all_jobs_with_name(job_name: string): Job[] {
		return this._jobs.filter((job) =>
			job.get_all_top_level_attributes().find((att) => att.value === job_name && att.key === "name")
		);
	}

	/**
	 * Returns all jobs which have job_name as their parent
	 * @param string job_name
	 */
	get_all_jobs_with_this_parent(job_name: string): Job[] {
		return this._jobs.filter((job) =>
			job.get_all_top_level_attributes().find((att) => att.value === job_name && att.key === "parent")
		);
	}

	/**
	 * Returns the total number of jobs that have been parsed.
	 */
	get_total_jobs_parsed(): number {
		return this._jobs.length;
	}
}
