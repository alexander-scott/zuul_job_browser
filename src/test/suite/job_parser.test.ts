import * as vscode from "vscode";
import * as assert from "assert";

import path = require("path");
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { JobDefinitionparser } from "../../job_parsing/job_definition_parser";
import { JobDefinitionManager } from "../../job_parsing/job_definition_manager";
import { JobAttributeCollector } from "../../job_parsing/job_attribute_collector";
import { Job } from "../../data_structures/job";

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
			vscode.Uri.file(path.resolve(path.resolve(__dirname, "test_files"), "test-jobs-basic.yaml"))
		);
		let test_file_decoded = new TextDecoder("utf-8").decode(test_file_encoded);
		test_file = await vscode.workspace.openTextDocument({ language: "yaml", content: test_file_decoded });
		//vscode.window.showTextDocument(test_file);
	}

	test("Test correct total job count is parsed", async () => {
		let job_manager = new JobDefinitionManager();
		let expected_jobs_found = 10;

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let total_jobs_found = job_manager.get_total_jobs_parsed();

		assert.equal(total_jobs_found, expected_jobs_found);
	});

	//#region Find job by name

	test("Test find job by name - normal", async () => {
		let job_manager = new JobDefinitionManager();
		let job_name = "test-job-1";

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let job = job_manager.get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	test("Test find job by name - no space", async () => {
		let job_manager = new JobDefinitionManager();
		let job_name = "test-job-no-space";

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let job = job_manager.get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	test("Test find job by name - multiple spaces", async () => {
		let job_manager = new JobDefinitionManager();
		let job_name = "test-job-multipe-spaces";

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let job = job_manager.get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	//#endregion

	//#region Find job by parent

	test("Test find jobs with parent", async () => {
		let job_manager = new JobDefinitionManager();
		let parent_name = "test-job-1";
		let expected_children = 2;

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let child_jobs = job_manager.get_all_jobs_with_this_parent(parent_name);

		assert.equal(child_jobs.length, expected_children);
	});

	//#endregion

	//#region Correct job attribute parsing

	test("Test parse job attribute with child override", async () => {
		let job_manager = new JobDefinitionManager();
		let job_name = "test-job-with-attribute-overrides";
		let expected_child_attribute: string = ' "ubuntu-something"';
		let expected_parent_attribute: string = ' "42"';

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let job = job_manager.get_job_with_name(job_name);
		let attributes = JobAttributeCollector.get_attributes_for_job(job as Job, job_manager);
		let child_attribute = attributes["node-image"].attribute_value;
		let parent_attribute = attributes["cpp-version"].attribute_value;

		assert.equal(child_attribute, expected_child_attribute);
		assert.equal(parent_attribute, expected_parent_attribute);
	});

	test("Test parse job name with comment after", async () => {
		let job_manager = new JobDefinitionManager();
		let job_name = "test-job-with-comment-after";

		JobDefinitionparser.parse_job_location_data(test_file, job_manager);
		let job = job_manager.get_job_with_name(job_name);

		assert.notEqual(job, undefined);
	});

	//#endregion
});
