import * as vscode from "vscode";
import { Job } from "./job";

/**
 * Sample model of what the text in the document contains.
 */
export class JobDefinitionManager {
	private _jobs: Job[] = [];
	private _known_files: Set<string> = new Set();

	/**
	 * Add a new job to the array
	 * @param Job The job to add to the array of jobs
	 */
	add_job(job: Job): void {
		this._known_files.add(job.document.path);
		let job_name = job.job_attributes.find((att) => att.attribute_key === "name")?.attribute_value;
		if (!job_name) {
			console.error("Job doesn't have a name?!?!");
			return;
		}
		let existing_jobs = this.get_all_jobs_with_name(job_name);
		if (existing_jobs.length == 0) {
			this._jobs.push(job);
		} else {
			console.log("DUPLICATE JOB ADD ATTEMPT!");
		}
	}

	is_known_file(uri: vscode.Uri): boolean {
		return this._known_files.has(uri.path);
	}

	remove_all_jobs(): void {
		this._jobs = [];
		this._known_files = new Set();
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		this._known_files.delete(uri.path);
		this._jobs = this._jobs.filter((job) => job.job_attributes.find((att) => att.document.path !== uri.path));
	}

	get_all_jobs(): Job[] {
		return this._jobs;
	}

	get_all_jobs_in_document(uri: vscode.Uri): Job[] {
		return this._jobs.filter((job) => job.job_attributes.find((att) => att.document.path === uri.path));
	}

	/**
	 * Find a job at a specific location in a document.
	 */
	get_job_at(wordRange: vscode.Range): Job | undefined {
		return this._jobs.find((job) => job.job_attributes.find((att) => att.attribute_location.contains(wordRange)));
	}

	/**
	 * Finds the job called job_name and then finds it's parent job.
	 * @param string job_name
	 */
	get_parent_job_from_job_name(job_name: string): Job | undefined {
		let parent_name = this._jobs
			.find((job) => job.job_attributes.find((att) => att.attribute_value === job_name && att.attribute_key === "name"))
			?.job_attributes.find((att) => att.attribute_key === "parent")?.attribute_value;

		if (parent_name) {
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
			job.job_attributes.find((att) => att.attribute_value === job_name && att.attribute_key === "name")
		);
	}

	/**
	 * Returns all the jobs which have job_name as their name. In most cases, this should just be a single job.
	 * @param string job_name
	 */
	get_all_jobs_with_name(job_name: string): Job[] {
		return this._jobs.filter((job) =>
			job.job_attributes.find((att) => att.attribute_value === job_name && att.attribute_key === "name")
		);
	}

	/**
	 * Returns all jobs which have job_name as their parent
	 * @param string job_name
	 */
	get_all_jobs_with_this_parent(job_name: string): Job[] {
		return this._jobs.filter((job) =>
			job.job_attributes.find((att) => att.attribute_value === job_name && att.attribute_key === "parent")
		);
	}
}
