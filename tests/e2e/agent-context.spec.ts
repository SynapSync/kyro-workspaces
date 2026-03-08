import { expect, test } from "@playwright/test";
import { setupCommonRoutes, navigateTo, waitForAppReady, TEST_PROJECT } from "./helpers";

const now = new Date().toISOString();

test.describe("agent context panel", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page, {
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "active",
          objective: "Validate context panel",
          tasks: [{ id: "t1", title: "Task 1", status: "pending", priority: "medium", tags: [], createdAt: now, updatedAt: now }],
          startDate: now,
          version: "1.5.0",
        },
      ],
    });
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);
  });

  test("shows active project name", async ({ page }) => {
    await expect(page.getByText(new RegExp(`Project:\\s*${TEST_PROJECT.name}`))).toBeVisible();
  });

  test("shows active sprint when on sprint page", async ({ page }) => {
    await navigateTo(page, "Sprints");
    await page.getByRole("link", { name: "Board" }).first().click();
    await expect(page.getByText(/Sprint:\s*Sprint 1/)).toBeVisible();
  });

  test("shows dash when no sprint selected", async ({ page }) => {
    await expect(page.getByText(/Sprint:\s*—/)).toBeVisible();
  });
});
