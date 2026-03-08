import { expect, test } from "@playwright/test";
import { setupCommonRoutes } from "./helpers";

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
            { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1" },
            { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2" },
          ],
          phases: [
            {
              name: "Phase 1 — Type System",
              objective: "Create domain types",
              isEmergent: false,
              tasks: [
                { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1" },
                { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2" },
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
  });

  test("navigates from sprint list to sprint detail", async ({ page }) => {
    await page.goto("/");

    // Go to Sprints page
    await page.getByRole("button", { name: "Sprints" }).first().click();
    await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();

    // Click on sprint to open detail
    await page.getByText("Sprint 1 — Foundation").click();

    // Should see the sprint detail page with section tabs
    await expect(page.getByText("Sprint 1 — Foundation")).toBeVisible();
  });
});
