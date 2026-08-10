import * as vscode from "vscode";
import { Logger } from "../file_parsing/logger";
import { Job } from "../data_structures/job";

/**
 * Holds all the parsed jobs and offers useful helpful functions.
 */
export class JobManager {
	private _jobs: Job[] = [];
	// Index maps for O(1) lookups by name and parent
	private _jobs_by_name = new Map<string, Job[]>();
	private _jobs_by_parent = new Map<string, Job[]>();

	/**
	 * Add a new job to the array
	 * @param Job The job to add to the array of jobs
	 */
	add_job(job: Job): void {
		const job_name = job.get_name_value();
		if (this._jobs_by_name.has(job_name)) {
			Logger.getInstance().debug("DUPLICATE JOB ADD ATTEMPT!");
			return;
		}
		this._jobs.push(job);
		this._jobs_by_name.set(job_name, [job]);
		const parent = job.get_parent_value();
		if (parent !== undefined) {
			if (!this._jobs_by_parent.has(parent)) {
				this._jobs_by_parent.set(parent, []);
			}
			this._jobs_by_parent.get(parent)!.push(job);
		}
	}

	remove_all_jobs(): void {
		this._jobs = [];
		this._jobs_by_name.clear();
		this._jobs_by_parent.clear();
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		const remaining: Job[] = [];
		for (const job of this._jobs) {
			if (job.document.path === uri.path) {
				this._jobs_by_name.delete(job.get_name_value());
				const parent = job.get_parent_value();
				if (parent !== undefined) {
					const siblings = this._jobs_by_parent.get(parent);
					if (siblings) {
						const updated = siblings.filter((j) => j !== job);
						if (updated.length === 0) {
							this._jobs_by_parent.delete(parent);
						} else {
							this._jobs_by_parent.set(parent, updated);
						}
					}
				}
			} else {
				remaining.push(job);
			}
		}
		this._jobs = remaining;
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
		for (const job of this._jobs) {
			for (const loc of job.get_all_value_locations()) {
				if (loc.get_as_vscode_location().contains(wordRange)) {
					return job;
				}
			}
		}
		return undefined;
	}

	/**
	 * Finds the job called job_name and then finds it's parent job.
	 * @param string job_name
	 */
	get_parent_job_from_job_name(job_name: string): Job | undefined {
		const job = this.get_job_with_name(job_name);
		if (!job) {
			return undefined;
		}

		const parent_name = job.get_parent_value();
		if (!parent_name) {
			return undefined;
		}

		return this.get_job_with_name(parent_name);
	}

	/**
	 * Returns a single job which has job_name as their name.
	 * @param string job_name
	 */
	get_job_with_name(job_name: string): Job | undefined {
		return this._jobs_by_name.get(job_name)?.[0];
	}

	/**
	 * Returns all the jobs which have job_name as their name. In most cases, this should just be a single job.
	 * @param string job_name
	 */
	get_all_jobs_with_name(job_name: string): Job[] {
		return this._jobs_by_name.get(job_name) ?? [];
	}

	/**
	 * Returns all jobs which have parent_name as their parent
	 * @param string parent_name
	 */
	get_all_jobs_with_this_parent(parent_name: string): Job[] {
		return this._jobs_by_parent.get(parent_name) ?? [];
	}

	/**
	 * Returns the total number of jobs that have been parsed.
	 */
	get_total_jobs_parsed(): number {
		return this._jobs.length;
	}
}
