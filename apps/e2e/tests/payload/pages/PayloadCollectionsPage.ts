import { expect, type Locator, type Page } from "@playwright/test";
import { PayloadBasePage } from "./PayloadBasePage";

export class PayloadCollectionsPage extends PayloadBasePage {
	readonly createNewButton: Locator;
	readonly searchInput: Locator;
	readonly listTable: Locator;
	readonly paginationNext: Locator;
	readonly paginationPrev: Locator;
	readonly actionsDropdownTrigger: Locator;
	readonly deleteButton: Locator;
	readonly confirmDeleteButton: Locator;
	readonly bulkActionsCheckbox: Locator;
	readonly bulkDeleteButton: Locator;
	readonly filterButton: Locator;
	readonly sortButton: Locator;
	readonly noResultsMessage: Locator;
	readonly collectionTitle: Locator;
	readonly editButton: Locator;
	readonly duplicateButton: Locator;

	constructor(page: Page) {
		super(page);

		// Collection list elements
		// Use .first() to avoid strict mode violations when multiple "Create New" elements exist
		this.createNewButton = page
			.locator('a:has-text("Create New"), button:has-text("Create New")')
			.first();
		this.searchInput = page.locator('input[placeholder*="Search"]');
		this.listTable = page.locator("table, .list-table");

		// Pagination
		this.paginationNext = page.locator('button[aria-label="Next Page"]');
		this.paginationPrev = page.locator('button[aria-label="Previous Page"]');

		// Actions - Payload 3.x uses a dropdown menu for document actions
		// The trigger is an unlabeled button next to Save/Publish buttons
		this.actionsDropdownTrigger = page.locator(
			'.popup-button-list__toggle, button#action-delete + button, [class*="popup-button-list"] > button:first-child',
		);
		this.deleteButton = page.locator(
			'#action-delete, button:has-text("Delete")',
		);
		this.confirmDeleteButton = page.locator(
			'dialog button:has-text("Delete"), .modal button:has-text("Confirm"), button:has-text("Confirm")',
		);
		this.bulkActionsCheckbox = page.locator(
			'input[type="checkbox"][aria-label="Select all"]',
		);
		this.bulkDeleteButton = page.locator('button:has-text("Delete Selected")');

		// Filters and sorting
		this.filterButton = page.locator('button:has-text("Filter")');
		this.sortButton = page.locator('button[aria-label*="Sort"]');

		// Status indicators
		this.noResultsMessage = page.locator("text=/no results|no items|empty/i");
		this.collectionTitle = page.locator("h1, .collection-title");

		// Item actions
		this.editButton = page.locator(
			'a:has-text("Edit"), button:has-text("Edit")',
		);
		this.duplicateButton = page.locator('button:has-text("Duplicate")');
	}

	async navigateToCollection(collectionSlug: string) {
		await super.navigateToCollection(collectionSlug);
		await this.waitForCollectionLoad();
	}

	async waitForCollectionLoad() {
		await this.waitForPageLoad();

		// Wait for either content or no results message
		await Promise.race([
			this.listTable.waitFor({ state: "visible", timeout: 10000 }),
			this.noResultsMessage.waitFor({ state: "visible", timeout: 10000 }),
			this.page.waitForSelector(".collection-list", { timeout: 10000 }),
		]).catch(() => {});
	}

	async createNewItem() {
		await this.createNewButton.click();
		await this.page.waitForURL("**/create");
		await this.waitForPageLoad();
	}

	async searchItems(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.page.keyboard.press("Enter");
		await this.waitForCollectionLoad();
	}

	async getItemCount(): Promise<number> {
		// Check if there are no results
		if (
			await this.noResultsMessage
				.isVisible({ timeout: 1000 })
				.catch(() => false)
		) {
			return 0;
		}

		// Count rows in the table
		const rows = await this.page.locator("tbody tr, .list-item").count();
		return rows;
	}

	async selectFirstItem() {
		const firstItem = this.page.locator(
			"tbody tr:first-child a, .list-item:first-child a",
		);
		await firstItem.click();
		await this.waitForPageLoad();
	}

	async deleteFirstItem() {
		await this.selectFirstItem();

		// Payload 3.x hides the delete button inside an actions dropdown menu
		// The delete button has id="action-delete" and class="popup-button-list__button"
		// Force-clicking the hidden button is the most reliable approach

		// First, clear any focus from form fields to prevent issues
		await this.page.keyboard.press("Escape");
		await this.page.waitForTimeout(200);

		// Force click the delete button - it exists in the DOM but is hidden in dropdown
		// Force click bypasses the visibility check
		await this.page.locator("#action-delete").click({ force: true });

		// Wait for confirmation dialog to appear
		await this.page.waitForTimeout(500);

		// Payload 3.x shows a confirmation dialog with "Delete" button
		// Multiple possible selectors for the confirmation button
		const confirmSelectors = [
			"button#confirm-delete",
			'dialog button:has-text("Delete")',
			'[role="dialog"] button:has-text("Delete")',
			".confirm-delete button",
			'button:has-text("Confirm")',
			'button.btn--style-primary:has-text("Delete")',
		];

		let confirmed = false;
		for (const selector of confirmSelectors) {
			const confirmBtn = this.page.locator(selector).first();
			if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
				await confirmBtn.click();
				confirmed = true;
				break;
			}
		}

		// If no confirm button found, the delete might have already succeeded
		// or the dialog has a different structure
		if (!confirmed) {
			// Try clicking any visible button with "Delete" text
			const anyDeleteBtn = this.page.getByRole("button", { name: /delete/i });
			if (await anyDeleteBtn.isVisible({ timeout: 500 }).catch(() => false)) {
				await anyDeleteBtn.click();
			}
		}

		await this.expectToastMessage("successfully deleted");
	}

	async expectCollectionAccessible(collectionSlug: string) {
		await this.navigateToCollection(collectionSlug);
		await this.expectNoErrors();

		// Verify collection loaded properly
		const hasContent = await Promise.race([
			this.listTable.isVisible({ timeout: 5000 }),
			this.noResultsMessage.isVisible({ timeout: 5000 }),
			this.createNewButton.isVisible({ timeout: 5000 }),
		]);

		expect(hasContent).toBeTruthy();
	}

	async expectCollectionHasItems(minCount: number = 1) {
		const count = await this.getItemCount();
		expect(count).toBeGreaterThanOrEqual(minCount);
	}

	/**
	 * Fill content into a Lexical rich text editor
	 * Lexical editors render as contenteditable divs, not standard inputs
	 */
	async fillLexicalContent(content: string) {
		// Try multiple selectors for Lexical editor - Payload uses different structures
		const selectors = [
			'[data-lexical-editor="true"]',
			'.rich-text-lexical [contenteditable="true"]',
			".LexicalEditorTheme__root",
			'[role="textbox"][contenteditable="true"]',
		];

		for (const selector of selectors) {
			const lexicalEditor = this.page.locator(selector).first();
			if (await lexicalEditor.isVisible({ timeout: 1000 }).catch(() => false)) {
				// Click to focus the editor
				await lexicalEditor.click();
				// Small delay to ensure focus
				await this.page.waitForTimeout(100);
				// Type the content directly
				await this.page.keyboard.type(content);
				return;
			}
		}
	}

	async fillRequiredFields(data: Record<string, any>) {
		// Fill text inputs
		for (const [fieldName, value] of Object.entries(data)) {
			// First try standard input/textarea fields
			const field = this.page.locator(
				`input[name="${fieldName}"], textarea[name="${fieldName}"]`,
			);
			if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
				await field.fill(String(value));
				continue;
			}

			// If field is 'content', try Lexical editor
			if (fieldName === "content") {
				await this.fillLexicalContent(String(value));
			}
		}
	}

	async saveItem() {
		await this.saveButton.click();
		await this.expectToastMessage("successfully");
	}

	async checkCollectionPermissions(collectionSlug: string) {
		await this.navigateToCollection(collectionSlug);

		// Check for permission errors
		const hasPermissionError = await this.page
			.locator("text=/unauthorized|forbidden|not allowed/i")
			.isVisible({ timeout: 1000 })
			.catch(() => false);

		return !hasPermissionError;
	}
}
