import { expect, test } from "@playwright/test";
import { setupCommonRoutes, navigateTo, waitForAppReady } from "./helpers";

const now = new Date().toISOString();

test.describe("sprint detail page", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page, {
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1 — Foundation",
          status: "closed",
          sprintType: "refactor",
          tasks: [
            { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1", tags: [], createdAt: now, updatedAt: now },
            { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2", tags: [], createdAt: now, updatedAt: now },
          ],
          phases: [
            {
              id: "phase-1-1",
              name: "Phase 1 — Type System",
              objective: "Create domain types",
              isEmergent: false,
              tasks: [
                { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1", tags: [], createdAt: now, updatedAt: now },
                { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2", tags: [], createdAt: now, updatedAt: now },
              ],
            },
          ],
          debtItems: [
            { number: 1, item: "Missing tests", origin: "Sprint 1 Phase 1", sprintTarget: "Sprint 2", status: "open", resolvedIn: "" },
          ],
          sections: {
            retrospective: "Good sprint overall.",
            recommendations: "1. Add more tests\n2. Improve error handling",
          },
        },
      ],
    });
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("navigates from sprint list to sprint detail", async ({ page }) => {
    await navigateTo(page, "Sprints");
    await expect(page.getByRole("heading", { name: "Sprints", level: 1 })).toBeVisible();

    // Click the "Details" link on the sprint card
    await page.getByRole("link", { name: "Details" }).first().click();

    // Should navigate to sprint detail view
    await expect(page).toHaveURL(/\/sprints\/sprint-1\/detail/);
    await expect(page.getByRole("heading", { name: /Sprint 1/ })).toBeVisible();
  });
});
