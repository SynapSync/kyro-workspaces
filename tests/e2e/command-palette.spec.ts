import { expect, test } from "@playwright/test";
import { setupCommonRoutes, waitForAppReady, TEST_PROJECT } from "./helpers";

test.describe("command palette", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);
  });

  test("opens with Cmd+K and closes with Escape", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/Search tasks/)).toBeHidden();
  });

  test("switches between search and commands tabs with Cmd+J", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();

    // Switch to commands tab
    await page.keyboard.press("Meta+j");
    await expect(page.getByPlaceholder(/Type a command/)).toBeVisible();

    // Switch back to search tab
    await page.keyboard.press("Meta+j");
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
  });

  test("search filters results by query", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const input = page.getByPlaceholder(/Search tasks/);

    // Search for a known task
    await input.fill("kanban");
    await expect(page.getByText("Build kanban board")).toBeVisible();

    // Search for something else
    await input.fill("command palette");
    await expect(page.getByText("Add command palette")).toBeVisible();
  });

  test("search shows sprint results", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const input = page.getByPlaceholder(/Search tasks/);

    await input.fill("Foundation");
    // Should show sprint search result
    await expect(page.getByText("Sprint 1 — Foundation").first()).toBeVisible();
  });

  test("commands tab shows navigation items", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.keyboard.press("Meta+j");

    await expect(page.getByText("Go to Overview")).toBeVisible();
    await expect(page.getByText("Go to Sprints")).toBeVisible();
    await expect(page.getByText("Go to Findings")).toBeVisible();
  });

  test("navigates via command palette action", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.keyboard.press("Meta+j");

    await page.getByText("Go to Sprints").click();
    await expect(page.getByRole("heading", { name: "Sprints", level: 1 })).toBeVisible({ timeout: 10_000 });
  });
});
