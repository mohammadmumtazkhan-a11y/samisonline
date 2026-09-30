// @ts-check
import { test, expect } from "@playwright/test";

/** Dashboard Transactions — Rhemito demo records, search, Cancel & Resend rules. */

const visible = (page, testId) => page.getByTestId(testId).filter({ visible: true }).first();

test.describe("Dashboard · transactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("section-transactions")).toBeVisible();
  });

  test("shows the demo transactions with statuses", async ({ page }) => {
    await expect(page.getByTestId("text-transactions-count")).toHaveText("5 total");
    const section = page.getByTestId("section-transactions");
    for (const name of ["Monthly Rent", "Aisha Bello", "Bob Woolmer", "Sarah Chen", "James Okonkwo"]) {
      await expect(section.getByText(name).filter({ visible: true }).first()).toBeVisible();
    }
    await expect(section.getByText("Awaiting Payment").filter({ visible: true }).first()).toBeVisible();
    await expect(section.getByText("Scheduled").filter({ visible: true }).first()).toBeVisible();
  });

  test("Cancel only while awaiting payment / scheduled, Resend only when settled", async ({ page }) => {
    await expect(visible(page, "button-cancel-22502787")).toBeVisible();
    await expect(visible(page, "button-cancel-SCH001")).toBeVisible();
    await expect(page.getByTestId("button-cancel-22502784").filter({ visible: true })).toHaveCount(0);
    await expect(page.getByTestId("button-resend-22502784").filter({ visible: true })).toHaveCount(0);
    await expect(visible(page, "button-resend-22502785")).toBeVisible();
  });

  test("cancelling asks for confirmation, updates status and shows a toast", async ({ page }) => {
    await visible(page, "button-cancel-22502787").click();
    await expect(page.getByText("Cancel this transaction?")).toBeVisible();

    // Abort keeps it
    await page.getByTestId("button-keep-transaction").click();
    await expect(visible(page, "button-cancel-22502787")).toBeVisible();

    await visible(page, "button-cancel-22502787").click();
    await page.getByTestId("button-confirm-cancel").click();
    await expect(page.getByText("Transaction cancelled").first()).toBeVisible();
    await expect(page.getByTestId("button-cancel-22502787").filter({ visible: true })).toHaveCount(0);
    // Cancelled is terminal → Resend offered
    await expect(visible(page, "button-resend-22502787")).toBeVisible();
  });

  test("search filters by ref, name or service", async ({ page }) => {
    const search = page.getByTestId("input-search-transactions");
    await search.fill("mobile money");
    await expect(page.getByTestId("text-transactions-count")).toHaveText("1 total");
    await search.fill("zzz");
    await expect(page.getByTestId("empty-search-transactions")).toBeVisible();
    await page.getByRole("button", { name: "Reset search" }).click();
    await expect(page.getByTestId("text-transactions-count")).toHaveText("5 total");
  });

  test("Resend starts a new transfer", async ({ page }) => {
    await visible(page, "button-resend-22502785").click();
    await expect(page).toHaveURL(/\/send-money-flow/);
    await expect(page.getByRole("heading", { name: "Send Money" })).toBeVisible();
  });

  test("new customers still see the empty state", async ({ page }) => {
    await page.evaluate(() => sessionStorage.setItem("isNewCustomer", "true"));
    await page.reload();
    await expect(page.getByTestId("empty-transactions")).toBeVisible();
    await page.evaluate(() => sessionStorage.removeItem("isNewCustomer"));
  });
});
