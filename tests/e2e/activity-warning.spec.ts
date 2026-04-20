import { expect, test } from "@playwright/test";
import { setupCommonRoutes, waitForAppReady, TEST_PROJECT } from "./helpers";

const now = new Date().toISOString();

/**
 * Activity warning E2E tests.
 *
 * The warning banner appears when the store's `addActivity` action fires and
 * the POST to /api/activities fails or times out. This spec verifies the
 * happy path: normal navigation does NOT surface the activity warning banner.
 */
test.describe("activity warning banner", () => {
  test("does not appear during normal navigation", async ({ page }) => {
    await setupCommonRoutes(page, {
      sprints: [
        {
          id: "s1",
          name: "Sprint 1",
          status: "closed",
          tasks: [{ id: "t1", title: "Task 1", status: "done", priority: "medium", tags: [], createdAt: now, updatedAt: now }],
        },
      ],
    });

    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);

    // Verify app loaded
    await expect(page.getByRole("heading", { name: TEST_PROJECT.name, level: 1 })).toBeVisible({ timeout: 10_000 });

    // Activity warning banner should not appear
    await expect(page.getByText("Activity log warning")).toBeHidden();
  });
});
