import * as vscode from "vscode";
import * as assert from "assert";
import * as path from "path";
import { TextDecoder } from "util";

import { extensionId } from "../../contants";
import { FileManager } from "../../file_parsing/file_manager";

vscode.window.showInformationMessage("Start all diagnostic manager tests");

suite("Diagnostic Manager Test Suite", () => {
	let test_file: vscode.TextDocument;

	setup(async function () {
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			throw new Error("Extension was not found.");
		}
		await load_test_doc();
	});

	async function load_test_doc(): Promise<void> {
		const test_file_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files/zuul.d"), "test-diagnostics.yaml"))
		);
		const test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });
	}

	test("Test duplicate job names are tracked", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_manager = file_manager.get_job_manager();

		// The first occurrence is kept; the second is stored as a duplicate.
		assert.equal(job_manager.get_all_jobs_with_name("test-duplicate-job").length, 1);
		assert.equal(job_manager.has_duplicate_jobs_with_name("test-duplicate-job"), true);
	});

	test("Test non-duplicate job name is not flagged", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_manager = file_manager.get_job_manager();

		assert.equal(job_manager.has_duplicate_jobs_with_name("test-unique-job"), false);
	});

	test("Test duplicate jobs in document are returned", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_manager = file_manager.get_job_manager();
		const dup_jobs = job_manager.get_duplicate_jobs_in_document(test_file.uri);

		assert.equal(dup_jobs.length, 1);
		assert.equal(dup_jobs[0].get_name_value(), "test-duplicate-job");
	});

	test("Test remove_all_jobs clears duplicate tracking", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_manager = file_manager.get_job_manager();
		job_manager.remove_all_jobs();

		assert.equal(job_manager.has_duplicate_jobs_with_name("test-duplicate-job"), false);
		assert.equal(job_manager.get_duplicate_jobs_in_document(test_file.uri).length, 0);
	});

	test("Test remove_all_jobs_in_document clears duplicates for that document", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document_from_text_and_update_managers(test_file);

		const job_manager = file_manager.get_job_manager();
		job_manager.remove_all_jobs_in_document(test_file.uri);

		assert.equal(job_manager.get_duplicate_jobs_in_document(test_file.uri).length, 0);
	});
});
