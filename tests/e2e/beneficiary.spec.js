// @ts-check
import { test, expect } from "@playwright/test";

/**
 * Send money — Rhemito beneficiary process:
 * select a saved recipient (pre-filled Details + Banking Details) or create a new one,
 * with NGN rules (10-digit account, narration mandatory).
 */

/** Unique 10-digit NUBAN per test so the in-memory API never sees duplicates. */
let counter = 0;
const uniqueAccount = () => String(Date.now() + counter++).slice(-10);

async function goToRecipientStep(page) {
  await page.goto("/send-money-flow");
  await expect(page.getByRole("heading", { name: "Send Money" })).toBeVisible();
  await page.getByRole("button", { name: /^Continue$/ }).last().click();
  await expect(page.getByText("Who are you sending to?")).toBeVisible();
}

test.describe("Send money · beneficiaries", () => {
  test("lists only NGN recipients with their bank details", async ({ page }) => {
    await goToRecipientStep(page);
    await expect(page.getByTestId("recipient-row-ben-002")).toContainText("Access Bank");
    await expect(page.getByTestId("recipient-row-ben-002")).toContainText("Acct: 0876543210");
    // UK (GBP) recipient is outside the GBP → NGN corridor
    await expect(page.getByTestId("recipient-row-ben-004")).toHaveCount(0);
  });

  test("search filters the recipient list", async ({ page }) => {
    await goToRecipientStep(page);
    await page.getByLabel("Search recipient").fill("gtbank");
    await expect(page.getByTestId("recipient-row-ben-003")).toBeVisible();
    await expect(page.getByTestId("recipient-row-ben-002")).toHaveCount(0);
  });

  test("selecting a saved recipient pre-fills Details and Summary", async ({ page }) => {
    await goToRecipientStep(page);
    await page.getByTestId("recipient-row-ben-002").click();

    await expect(page.getByText("Banking Details")).toBeVisible();
    await expect(page.getByLabel(/^First Name/)).toHaveValue("Sarah");
    await expect(page.getByLabel(/^Last Name/)).toHaveValue("Chen");
    await expect(page.getByLabel(/^Bank Name/)).toHaveValue("Access Bank");
    await expect(page.getByLabel(/^Account Number/)).toHaveValue("0876543210");

    await page.getByTestId("button-details-continue").click();
    await expect(page.getByText("Sarah Chen").first()).toBeVisible();
    await expect(page.getByText("0876543210").first()).toBeVisible();
    await expect(page.getByText("Sort Code")).toHaveCount(0);
  });

  test("Details step enforces narration and 10-digit account for NGN", async ({ page }) => {
    await goToRecipientStep(page);
    await page.getByTestId("recipient-row-ben-001").click();
    await page.getByLabel(/^Narration/).fill("");
    await page.getByLabel(/^Account Number/).fill("12345");
    await page.getByTestId("button-details-continue").click();

    await expect(page.getByText("Narration is required for Nigerian accounts").first()).toBeVisible();
    await expect(page.getByText("Nigerian account numbers are 10 digits").first()).toBeVisible();
    // Still on Details
    await expect(page.getByText("Banking Details")).toBeVisible();
  });

  test("creates a new recipient (Rhemito form) and continues with it", async ({ page }) => {
    const account = uniqueAccount();
    await goToRecipientStep(page);
    await page.getByTestId("button-new-recipient").click();

    const dialog = page.getByTestId("dialog-add-recipient");
    await expect(dialog.getByText("Add New Recipient")).toBeVisible();
    // Country is locked to the NGN corridor
    await expect(dialog.getByTestId("select-recipient-country")).toBeDisabled();
    await expect(dialog.getByText("Payout currency:")).toContainText("NGN");

    // Empty submit shows validation
    await dialog.getByTestId("button-save-recipient").click();
    await expect(dialog.getByText("First name is required")).toBeVisible();
    await expect(dialog.getByText("Bank name is required")).toBeVisible();

    await dialog.getByTestId("input-recipient-first-name").fill("Chidi");
    await dialog.getByTestId("input-recipient-last-name").fill("Nwosu");
    await dialog.getByTestId("input-recipient-email").fill(`chidi.${account}@example.com`);
    await dialog.getByTestId("input-recipient-bank-name").fill("First Bank");
    await dialog.getByTestId("input-recipient-account-number").fill(account);
    await dialog.getByTestId("input-recipient-narration").fill("School fees");
    await dialog.getByTestId("button-save-recipient").click();

    await expect(page.getByText("Recipient added").first()).toBeVisible();
    await expect(dialog).toHaveCount(0);

    // Details pre-filled from the new beneficiary
    await expect(page.getByLabel(/^First Name/)).toHaveValue("Chidi");
    await expect(page.getByLabel(/^Bank Name/)).toHaveValue("First Bank");
    await expect(page.getByLabel(/^Account Number/)).toHaveValue(account);
    await expect(page.getByLabel(/^Narration/)).toHaveValue("School fees");

    // Saved: it now appears in the recipient list
    await page.getByRole("button", { name: /^Back$/ }).last().click();
    await expect(page.getByText("Chidi Nwosu").first()).toBeVisible();
  });

  test("full journey reaches Payment with a new business beneficiary", async ({ page }) => {
    const account = uniqueAccount();
    await goToRecipientStep(page);
    await page.getByTestId("button-new-recipient").click();
    const dialog = page.getByTestId("dialog-add-recipient");
    await dialog.getByTestId("button-recipient-type-business").click();
    await dialog.getByTestId("input-recipient-business-name").fill("Lagos Traders Ltd");
    await dialog.getByTestId("input-recipient-email").fill(`accounts.${account}@lagostraders.ng`);
    await dialog.getByTestId("input-recipient-bank-name").fill("Zenith Bank");
    await dialog.getByTestId("input-recipient-account-number").fill(account);
    await dialog.getByTestId("input-recipient-narration").fill("Invoice 1042");
    await dialog.getByTestId("button-save-recipient").click();

    await expect(page.getByLabel(/^Business Name/)).toHaveValue("Lagos Traders Ltd");
    await page.getByTestId("button-details-continue").click();
    await expect(page.getByText("Lagos Traders Ltd").first()).toBeVisible();
    await page.getByRole("button", { name: /Confirm & Continue/ }).last().click();
    await expect(page.getByText("How would you like to pay?")).toBeVisible({ timeout: 10_000 });
  });
});
