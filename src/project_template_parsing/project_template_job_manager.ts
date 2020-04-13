import * as vscode from "vscode";
import { ProjectTemplateJob } from "./project_template_job";

/**
 * Sample model of what the text in the document contains.
 */
export class ProjectTemplateJobManager {
	private _jobs: ProjectTemplateJob[] = [];
	private _known_files: Set<vscode.Uri> = new Set();

	add_job(job: ProjectTemplateJob): void {
		this._known_files.add(job.document);
		this._jobs.push(job);
	}

	is_known_file(uri: vscode.Uri): boolean {
		return this._known_files.has(uri);
	}

	remove_all_jobs_in_document(uri: vscode.Uri): void {
		this._known_files.delete(uri);
		this._jobs = this._jobs.filter((job) => job.document.path !== uri.path);
	}
}
