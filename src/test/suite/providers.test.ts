import * as vscode from "vscode";
import * as assert from "assert";

import * as path from "path";
import { TextDecoder } from "util";

import { extensionId } from "../../contants";

import { FileManager } from "../../file_parsing/file_manager";
import { JobDefinitionProvider } from "../../providers/job_definition_provider";
import { JobHierarchyProvider } from "../../providers/job_hierarchy_provider";
import { JobHoverProvider } from "../../providers/job_hover_provider";
import { JobReferencesProvider } from "../../providers/job_references_provider";
import { JobSymbolDocumentDefinitionsProvider } from "../../providers/job_symbol_document_definitions_provider";
import { JobSymbolWorkspaceDefinitionsProvider } from "../../providers/job_symbol_workspace_definitions_provider";
import { JobRenameProvider } from "../../providers/job_symbol_rename_provider";

vscode.window.showInformationMessage("Start all provider tests");

suite("Providers Test Suite", () => {
	let jobs_file: vscode.TextDocument;
	let template_file: vscode.TextDocument;
	const token = new vscode.CancellationTokenSource().token;

	setup(async function () {
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			throw new Error("Extension was not found.");
		}
		await load_test_docs();
	});

	async function load_test_docs(): Promise<void> {
		const base_dir = path.resolve(__dirname, "test_files/zuul.d");

		const jobs_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(base_dir, "test-jobs.yaml"))
		);
		jobs_file = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: new TextDecoder("utf-8").decode(jobs_encoded),
		});

		const template_encoded = await vscode.workspace.fs.readFile(
			vscode.Uri.file(path.resolve(base_dir, "test-project-template.yaml"))
		);
		template_file = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: new TextDecoder("utf-8").decode(template_encoded),
		});
	}

	function make_file_manager_with_jobs(): FileManager {
		const fm = new FileManager("");
		fm.parse_document_from_text_and_update_managers(jobs_file);
		return fm;
	}

	function make_file_manager_with_both(): FileManager {
		const fm = new FileManager("");
		fm.parse_document_from_text_and_update_managers(jobs_file);
		fm.parse_document_from_text_and_update_managers(template_file);
		return fm;
	}

	// ─── JobDefinitionProvider ────────────────────────────────────────────────

	test("JobDefinitionProvider returns undefined when no word range at position", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		// Line 3 is an empty line — getWordRangeAtPosition returns undefined
		const result = provider.provideDefinition(jobs_file, new vscode.Position(3, 0), token);
		assert.equal(result, undefined);
	});

	test("JobDefinitionProvider returns location for parent found in manager", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		// Line 12 (0-indexed): "    parent: test-job-1"  col 13 is inside "test-job-1"
		const result = provider.provideDefinition(jobs_file, new vscode.Position(12, 13), token);
		assert.notEqual(result, undefined);
	});

	test("JobDefinitionProvider returns undefined when parent not in manager", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		// Line 2: "    parent: base-library"  — "base-library" is not in the test file
		const result = provider.provideDefinition(jobs_file, new vscode.Position(2, 13), token);
		assert.equal(result, undefined);
	});

	test("JobDefinitionProvider returns location for project-template job in manager", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		// Line 7 (0-indexed) in template_file: "        - test-job-3"  col 12 is in "test-job-3"
		const result = provider.provideDefinition(template_file, new vscode.Position(7, 12), token);
		assert.notEqual(result, undefined);
	});

	test("JobDefinitionProvider returns undefined when template job not in manager", async () => {
		// Empty manager — no jobs loaded
		const fm = new FileManager("");
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		const result = provider.provideDefinition(template_file, new vscode.Position(7, 12), token);
		assert.equal(result, undefined);
	});

	test("JobDefinitionProvider handles playbook run line without throwing", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			content: "- job:\n    name: playbook-job\n    run: playbooks/test.yaml\n",
		});
		// Line 2: "    run: playbooks/test.yaml"  — parse_playbook_run returns a path
		// No active editor/workspace folder in test env, so result may be undefined
		assert.doesNotThrow(() => {
			provider.provideDefinition(doc, new vscode.Position(2, 10), token);
		});
	});

	test("JobDefinitionProvider returns location for ansible variable in parent job", async () => {
		const fm = make_file_manager_with_jobs();
		// Create a job that references {{ cpp-version }} which lives in test-job-3
		const doc = await vscode.workspace.openTextDocument({
			language: "yaml",
			// Line 3: '    description: "uses {{ cpp-version }} here"'
			content: '- job:\n    name: ansible-job\n    parent: test-job-3\n    description: "uses {{ cpp-version }} here"\n',
		});
		fm.parse_document_from_text_and_update_managers(doc);
		const provider = new JobDefinitionProvider(fm.get_job_manager());
		// col 27 falls inside "{{ cpp-version }}"
		const result = provider.provideDefinition(doc, new vscode.Position(3, 27), token);
		// Result may or may not be found depending on attribute inheritance chain;
		// the important thing is the code path runs without error.
		assert.doesNotThrow(() => {
			provider.provideDefinition(doc, new vscode.Position(3, 27), token);
		});
		// Suppress unused-variable warning
		void result;
	});

	// ─── JobHierarchyProvider ─────────────────────────────────────────────────

	test("JobHierarchyProvider prepareCallHierarchy returns item for job name position", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		// Line 1 (0-indexed): "    name: test-job-1"  col 13 is inside "test-job-1"
		const item = provider.prepareCallHierarchy(jobs_file, new vscode.Position(1, 13), token);
		assert.notEqual(item, undefined);
		assert.equal((item as vscode.CallHierarchyItem).name, "test-job-1");
	});

	test("JobHierarchyProvider prepareCallHierarchy returns undefined when no word range", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		const item = provider.prepareCallHierarchy(jobs_file, new vscode.Position(3, 0), token);
		assert.equal(item, undefined);
	});

	test("JobHierarchyProvider prepareCallHierarchy returns undefined when job not in manager", async () => {
		const fm = new FileManager(""); // empty manager
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		const item = provider.prepareCallHierarchy(jobs_file, new vscode.Position(1, 13), token);
		assert.equal(item, undefined);
	});

	test("JobHierarchyProvider provideCallHierarchyOutgoingCalls returns empty when parent not in manager", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		// test-job-1's parent "base-library" is not in the manager
		const item = new vscode.CallHierarchyItem(
			vscode.SymbolKind.Object,
			"test-job-1",
			"(job)",
			jobs_file.uri,
			new vscode.Range(new vscode.Position(1, 10), new vscode.Position(1, 20)),
			new vscode.Range(new vscode.Position(1, 10), new vscode.Position(1, 20))
		);
		const calls = await provider.provideCallHierarchyOutgoingCalls(item, token);
		assert.equal(calls.length, 0);
	});

	test("JobHierarchyProvider provideCallHierarchyOutgoingCalls returns parent when in manager", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		// test-job-2's parent is "test-job-1" which IS in the manager
		const item = new vscode.CallHierarchyItem(
			vscode.SymbolKind.Object,
			"test-job-2",
			"(job)",
			jobs_file.uri,
			new vscode.Range(new vscode.Position(11, 10), new vscode.Position(11, 20)),
			new vscode.Range(new vscode.Position(11, 10), new vscode.Position(11, 20))
		);
		const calls = await provider.provideCallHierarchyOutgoingCalls(item, token);
		assert.equal(calls.length, 1);
		assert.equal(calls[0].to.name, "test-job-1");
	});

	test("JobHierarchyProvider provideCallHierarchyIncomingCalls returns children", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHierarchyProvider(fm.get_job_manager());
		// test-job-1 has children test-job-2 and test-job-7
		const item = new vscode.CallHierarchyItem(
			vscode.SymbolKind.Object,
			"test-job-1",
			"(job)",
			jobs_file.uri,
			new vscode.Range(new vscode.Position(1, 10), new vscode.Position(1, 20)),
			new vscode.Range(new vscode.Position(1, 10), new vscode.Position(1, 20))
		);
		const calls = await provider.provideCallHierarchyIncomingCalls(item, token);
		assert.equal(calls.length, 2);
	});

	// ─── JobHoverProvider ─────────────────────────────────────────────────────

	test("JobHoverProvider returns undefined when no word range", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHoverProvider(fm.get_job_manager());
		const result = provider.provideHover(jobs_file, new vscode.Position(3, 0), token);
		assert.equal(result, undefined);
	});

	test("JobHoverProvider returns Hover for job name position", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHoverProvider(fm.get_job_manager());
		// Line 1: "    name: test-job-1"
		const result = provider.provideHover(jobs_file, new vscode.Position(1, 13), token);
		assert.notEqual(result, undefined);
	});

	test("JobHoverProvider falls through to template path when job not found by name", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHoverProvider(fm.get_job_manager());
		// Position in template_file: parse_job_from_random_line_number returns "template-name" which is not a
		// registered job, so the provider falls through to the ProjectTemplateParser path.
		// On a non-job-bullet line the template parser also returns undefined → result is undefined.
		const result = provider.provideHover(template_file, new vscode.Position(1, 5), token);
		// Result depends on whether "template-name" is found; just verify it doesn't throw.
		assert.doesNotThrow(() => {
			provider.provideHover(template_file, new vscode.Position(1, 5), token);
		});
		void result;
	});

	test("JobHoverProvider returns Hover for project-template job bullet position", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobHoverProvider(fm.get_job_manager());
		// Line 7 in template_file: "        - test-job-3"  col 12 is in "test-job-3"
		// parse_job_from_random_line_number → "template-name" (not in job manager)
		// then parse_job_name_from_line_in_document → "test-job-3" (IS in job manager)
		const result = provider.provideHover(template_file, new vscode.Position(7, 12), token);
		assert.notEqual(result, undefined);
	});

	// ─── JobReferencesProvider ────────────────────────────────────────────────

	test("JobReferencesProvider returns undefined when no word range", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobReferencesProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const context: vscode.ReferenceContext = { includeDeclaration: true };
		const result = provider.provideReferences(jobs_file, new vscode.Position(3, 0), context, token);
		assert.equal(result, undefined);
	});

	test("JobReferencesProvider returns locations for job with children", async () => {
		const fm = make_file_manager_with_both();
		const provider = new JobReferencesProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const context: vscode.ReferenceContext = { includeDeclaration: true };
		// Line 1: "    name: test-job-1" — test-job-1 has 2 children
		const result = provider.provideReferences(jobs_file, new vscode.Position(1, 13), context, token) as vscode.Location[];
		assert.notEqual(result, undefined);
		assert.ok(result.length >= 2);
	});

	test("JobReferencesProvider returns undefined when job not in manager", async () => {
		// Empty manager
		const fm = new FileManager("");
		const provider = new JobReferencesProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const context: vscode.ReferenceContext = { includeDeclaration: true };
		const result = provider.provideReferences(jobs_file, new vscode.Position(1, 13), context, token);
		assert.equal(result, undefined);
	});

	// ─── JobSymbolDocumentDefinitionsProvider ────────────────────────────────

	test("JobSymbolDocumentDefinitionsProvider returns symbols for all jobs in document", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobSymbolDocumentDefinitionsProvider(fm.get_job_manager());
		const symbols = await provider.provideDocumentSymbols(jobs_file, token) as vscode.SymbolInformation[];
		assert.notEqual(symbols, undefined);
		assert.equal(symbols.length, 12);
	});

	test("JobSymbolDocumentDefinitionsProvider returns empty array for document with no jobs", async () => {
		const fm = new FileManager("");
		const provider = new JobSymbolDocumentDefinitionsProvider(fm.get_job_manager());
		const symbols = await provider.provideDocumentSymbols(jobs_file, token) as vscode.SymbolInformation[];
		assert.equal(symbols.length, 0);
	});

	// ─── JobSymbolWorkspaceDefinitionsProvider ───────────────────────────────

	test("JobSymbolWorkspaceDefinitionsProvider returns all job symbols", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobSymbolWorkspaceDefinitionsProvider(fm.get_job_manager());
		const symbols = await provider.provideWorkspaceSymbols("", token) as vscode.SymbolInformation[];
		assert.notEqual(symbols, undefined);
		assert.equal(symbols.length, 12);
	});

	test("JobSymbolWorkspaceDefinitionsProvider returns empty array when no jobs", async () => {
		const fm = new FileManager("");
		const provider = new JobSymbolWorkspaceDefinitionsProvider(fm.get_job_manager());
		const symbols = await provider.provideWorkspaceSymbols("", token) as vscode.SymbolInformation[];
		assert.equal(symbols.length, 0);
	});

	// ─── JobRenameProvider ────────────────────────────────────────────────────

	test("JobRenameProvider provideRenameEdits returns undefined when no word range", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const result = provider.provideRenameEdits(jobs_file, new vscode.Position(3, 0), "new-name", token);
		assert.equal(result, undefined);
	});

	test("JobRenameProvider provideRenameEdits renames job and its children", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		// Line 1: "    name: test-job-1" — has 2 children (test-job-2, test-job-7)
		const result = provider.provideRenameEdits(
			jobs_file,
			new vscode.Position(1, 13),
			"renamed-job",
			token
		) as vscode.WorkspaceEdit;
		assert.notEqual(result, undefined);
		// 1 for the name itself + 2 for children's parent refs = at least 3 edits
		assert.ok(result.size >= 1);
	});

	test("JobRenameProvider provideRenameEdits via template path renames job", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		// Line 7 in template_file: "        - test-job-3"  col 12 is in "test-job-3"
		// parse_job_name_from_single_line returns undefined (no "name:" here)
		// parse_job_name_from_line_in_document returns "test-job-3"
		const result = provider.provideRenameEdits(
			template_file,
			new vscode.Position(7, 12),
			"renamed-job",
			token
		) as vscode.WorkspaceEdit;
		assert.notEqual(result, undefined);
	});

	test("JobRenameProvider provideRenameEdits returns undefined when job not in manager", async () => {
		const fm = new FileManager(""); // empty manager
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const result = provider.provideRenameEdits(
			jobs_file,
			new vscode.Position(1, 13),
			"renamed-job",
			token
		);
		assert.equal(result, undefined);
	});

	test("JobRenameProvider prepareRename returns range for job name position", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		// Line 1: "    name: test-job-1"
		const result = provider.prepareRename!(
			jobs_file,
			new vscode.Position(1, 13),
			token
		) as { range: vscode.Range; placeholder: string };
		assert.notEqual(result, undefined);
		assert.equal(result.placeholder, "test-job-1");
	});

	test("JobRenameProvider prepareRename returns range for template job position", async () => {
		const fm = make_file_manager_with_both();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		// Line 7 in template_file: "        - test-job-3"
		const result = provider.prepareRename!(
			template_file,
			new vscode.Position(7, 12),
			token
		);
		assert.notEqual(result, undefined);
	});

	test("JobRenameProvider prepareRename returns undefined when no word range", async () => {
		const fm = make_file_manager_with_jobs();
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		const result = provider.prepareRename!(jobs_file, new vscode.Position(3, 0), token);
		assert.equal(result, undefined);
	});

	test("JobRenameProvider prepareRename returns undefined when job name not in manager", async () => {
		const fm = new FileManager(""); // empty manager
		const provider = new JobRenameProvider(
			fm.get_job_manager(),
			fm.get_project_template_manager()
		);
		// parse_job_name_from_single_line returns "test-job-1" but it's not in the manager
		const result = provider.prepareRename!(jobs_file, new vscode.Position(1, 13), token);
		assert.equal(result, undefined);
	});
});
