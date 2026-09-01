import * as vscode from "vscode";
import * as path from "path";
import { JobManager } from "../job_parsing/job_manager";
import { Job } from "../data_structures/job";

/**
 * Validates parsed jobs and reports diagnostics (errors/warnings) to VSCode.
 * Currently checks for:
 *   - Playbook files that are referenced but do not exist on disk
 *   - Duplicate job name definitions
 */
export class DiagnosticManager {
	private static readonly PLAYBOOK_KEYS = ["run", "pre-run", "post-run", "cleanup-run"];

	constructor(
		private readonly diagnostic_collection: vscode.DiagnosticCollection,
		private readonly job_manager: JobManager
	) {}

	/**
	 * Validates all jobs in the given document and updates the diagnostic collection.
	 */
	async validate_document(doc_uri: vscode.Uri): Promise<void> {
		const diagnostics: vscode.Diagnostic[] = [];
		const workspace_folder = vscode.workspace.getWorkspaceFolder(doc_uri);

		// Validate regular (first-occurrence) jobs in this document
		const regular_jobs = this.job_manager.get_all_jobs_in_document(doc_uri);
		for (const job of regular_jobs) {
			if (workspace_folder) {
				const playbook_diags = await this.validate_playbooks(job, workspace_folder);
				diagnostics.push(...playbook_diags);
			}
			// Flag the original if a duplicate of its name was later encountered
			if (this.job_manager.has_duplicate_jobs_with_name(job.get_name_value())) {
				diagnostics.push(this.make_duplicate_diagnostic(job));
			}
		}

		// Also validate jobs that were rejected as duplicates (second+ occurrences)
		const duplicate_jobs = this.job_manager.get_duplicate_jobs_in_document(doc_uri);
		for (const job of duplicate_jobs) {
			if (workspace_folder) {
				const playbook_diags = await this.validate_playbooks(job, workspace_folder);
				diagnostics.push(...playbook_diags);
			}
			diagnostics.push(this.make_duplicate_diagnostic(job));
		}

		this.diagnostic_collection.set(doc_uri, diagnostics);
	}

	/**
	 * Removes diagnostics for the given document (e.g. when it is deleted).
	 */
	clear_document(doc_uri: vscode.Uri): void {
		this.diagnostic_collection.delete(doc_uri);
	}

	dispose(): void {
		this.diagnostic_collection.dispose();
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private async validate_playbooks(job: Job, workspace_folder: vscode.WorkspaceFolder): Promise<vscode.Diagnostic[]> {
		const diagnostics: vscode.Diagnostic[] = [];

		for (const key of DiagnosticManager.PLAYBOOK_KEYS) {
			// job_mapping is typed `any` so we can access array/object values directly
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const raw_value = (job.job_mapping as any)[key];
			if (!raw_value) {
				continue;
			}

			const playbook_paths = this.extract_playbook_paths(raw_value);
			for (const playbook_path of playbook_paths) {
				const full_path = path.join(workspace_folder.uri.fsPath, playbook_path);
				const exists = await this.file_exists(vscode.Uri.file(full_path));
				if (!exists) {
					const range = this.get_range_for_value(job, playbook_path);
					diagnostics.push(
						new vscode.Diagnostic(
							range,
							`Playbook '${playbook_path}' does not exist`,
							vscode.DiagnosticSeverity.Error
						)
					);
				}
			}
		}

		return diagnostics;
	}

	private make_duplicate_diagnostic(job: Job): vscode.Diagnostic {
		const job_name = job.get_name_value();
		const range = this.get_range_for_value(job, job_name);
		return new vscode.Diagnostic(range, `Duplicate job name '${job_name}'`, vscode.DiagnosticSeverity.Error);
	}

	/**
	 * Recursively extracts playbook file paths from a raw YAML playbook value.
	 * Handles:
	 *   - Plain string:            "playbooks/run.yaml"
	 *   - Object with name key:    { name: "playbooks/run.yaml", ... }
	 *   - Array of the above:      ["playbooks/a.yaml", { name: "playbooks/b.yaml" }]
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private extract_playbook_paths(value: any): string[] {
		if (typeof value === "string") {
			return [value];
		}
		if (Array.isArray(value)) {
			const result: string[] = [];
			for (const item of value) {
				result.push(...this.extract_playbook_paths(item));
			}
			return result;
		}
		if (value && typeof value === "object" && typeof value.name === "string") {
			return [value.name];
		}
		return [];
	}

	private async file_exists(uri: vscode.Uri): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}

	private get_range_for_value(job: Job, value: string): vscode.Range {
		try {
			return job.get_location_of_value(value).get_as_vscode_location();
		} catch {
			// Fall back to the job name position
			try {
				return job.get_location_of_value(job.get_name_value()).get_as_vscode_location();
			} catch {
				return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
			}
		}
	}
}
