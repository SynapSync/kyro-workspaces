import { expect, test } from "@playwright/test";
import { setupCommonRoutes } from "./helpers";

/**
 * Activity warning E2E tests.
 *
 * The warning banner appears when the store's `addActivity` action fires and
 * the POST to /api/activities fails or times out. In the current read-only
 * model no user-facing action triggers `addActivity` (the "Create Sprint" flow
 * was removed in Sprint 4), so the warning path cannot be reached through the
 * UI alone. The actual warning/dismiss mechanism is exercised by the unit-level
 * integration tests in activities-trace.integration.test.ts.
 *
 * This spec verifies the happy path: normal navigation does NOT surface the
 * activity warning banner.
 */
test.describe("activity warning banner", () => {
  test("does not appear during normal navigation", async ({ page }) => {
    await setupCommonRoutes(page, {
      sprints: [
        {
          id: "s1",
          name: "Sprint 1",
          status: "closed",
          tasks: [{ id: "t1", title: "Task 1", status: "done", priority: "medium" }],
        },
      ],
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    // Navigate through several pages
    await page.getByRole("button", { name: "Sprints" }).first().click();
    await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();

    await page.getByRole("button", { name: "Findings" }).first().click();
    await expect(page.getByRole("heading", { name: "Findings" })).toBeVisible();

    // Activity warning banner should not appear at any point
    await expect(page.getByText("Activity log warning")).toBeHidden();
  });
});
