import * as vscode from "vscode";
import * as assert from "assert";

import path = require("path");
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { JobAttributeCollector } from "../../job_parsing/job_attribute_collector";
import { FileManager } from "../../file_parsing/file_manager";
import { NewJob } from "../../data_structures/new_job";

vscode.window.showInformationMessage("Start all job parser tests");

suite("Job Parser Test Suite", () => {
	let extension: vscode.Extension<any>;
	let test_file: vscode.TextDocument;

	setup(async function () {
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			throw new Error("Extension was not found.");
		}
		if (ext) {
			extension = ext;
		}

		await load_test_doc();
	});

	async function load_test_doc(): Promise<void> {
		let test_file_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files"), "test-jobs.yaml"))
		);
		let test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });

		//vscode.window.showTextDocument(test_file);
	}

	test("Test correct total job count is parsed", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let expected_jobs_found = 12;
		let total_jobs_found = file_manager.get_job_manager().get_total_jobs_parsed();

		assert.equal(total_jobs_found, expected_jobs_found);
	});

	//#region Find job by name

	test("Test find job by name", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let job_name = "test-job-1";
		let job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);

		job_name = "test-job-with-comment-after";
		job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);

		job_name = "test-job-after-comment";
		job = file_manager.get_job_manager().get_job_with_name(job_name);
		assert.notEqual(job, undefined);
	});

	//#endregion

	//#region Find job by parent

	test("Test find jobs with parent", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let parent_name = "test-job-1";
		let expected_children = 2;

		let child_jobs = file_manager.get_job_manager().get_all_jobs_with_this_parent(parent_name);

		assert.equal(child_jobs.length, expected_children);
	});

	//#endregion

	//#region Correct job attribute parsing

	test("Test parse job attribute with child override", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);
		let job_name = "test-job-with-attribute-overrides";
		let expected_child_attribute: string = "ubuntu-something";
		let expected_parent_attribute: string = "42";
		let job = file_manager.get_job_manager().get_job_with_name(job_name) as NewJob;
		let attributes = JobAttributeCollector.get_attributes_for_job(job, file_manager.get_job_manager());
		let child_attribute = attributes["node-image"];
		let parent_attribute = attributes["cpp-version"];
		assert.equal(child_attribute, expected_child_attribute);
		assert.equal(parent_attribute, expected_parent_attribute);
	});

	test("Test parse job name with comment after", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let job_name = "test-job-with-comment-after";

		let job = file_manager.get_job_manager().get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	//#endregion

	//#region Location tests

	test("Test get correct job name line number", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let job_name = "test-job-3";
		let expected_job_line_number = 5;
		let job = file_manager.get_job_manager().get_job_with_name(job_name);
		let job_name_location = job?.get_location_of_value(job_name!).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_name_location, expected_job_line_number);
	});

	test("Test get correct job parent name line number", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let job_name = "test-job-2";
		let expected_job_line_number = 12;
		let job = file_manager.get_job_manager().get_job_with_name(job_name);
		let parent_name = job?.get_parent_value();
		let job_line_number = job?.get_location_of_value(parent_name!).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_line_number, expected_job_line_number);
	});

	test("Test get correct job line number with multiple name variables", async () => {
		const file_manager = new FileManager("");
		file_manager.parse_document(test_file);

		let job_name = "test-job-with-multiple-name-variables";
		let expected_job_line_number = 50;
		let job = file_manager.get_job_manager().get_job_with_name(job_name);
		let job_line_number = job?.get_location_of_value(job_name).line_number;
		assert.notEqual(job, undefined);
		assert.equal(job_line_number, expected_job_line_number);
	});

	//#endregion
});
