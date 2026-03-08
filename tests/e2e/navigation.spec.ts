import { expect, test } from "@playwright/test";
import { setupCommonRoutes } from "./helpers";

test.describe("sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page, {
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1 — Foundation",
          status: "closed",
          sprintType: "refactor",
          tasks: [
            { id: "t1", title: "Task 1", status: "done", priority: "medium" },
          ],
          sections: {
            retrospective: "## Retro\nGood sprint.",
          },
          debtItems: [
            { number: 1, item: "Test debt", origin: "Sprint 1", sprintTarget: "Sprint 2", status: "open", resolvedIn: "" },
          ],
        },
      ],
      findings: [
        {
          id: "f-01",
          number: 1,
          title: "Architecture Layer Violations",
          summary: "Components import directly from data layer",
          severity: "medium",
          details: "Detailed analysis of violations...",
          affectedFiles: ["lib/store.ts", "components/app.tsx"],
          recommendations: ["Add service layer"],
        },
      ],
    });
  });

  test("navigates through all main nav items", async ({ page }) => {
    await page.goto("/");

    // Should start at Overview
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    // Navigate to Sprints
    await page.getByRole("button", { name: "Sprints" }).first().click();
    await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();
    await expect(page.getByText("Sprint 1 — Foundation")).toBeVisible();

    // Navigate to Findings
    await page.getByRole("button", { name: "Findings" }).first().click();
    await expect(page.getByRole("heading", { name: "Findings" })).toBeVisible();
    await expect(page.getByText("Architecture Layer Violations")).toBeVisible();

    // Navigate to Roadmap
    await page.getByRole("button", { name: "Roadmap" }).first().click();
    await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
    await expect(page.getByText("Foundation")).toBeVisible();

    // Navigate to Debt
    await page.getByRole("button", { name: "Debt" }).first().click();
    await expect(page.getByRole("heading", { name: "Technical Debt" })).toBeVisible();
    await expect(page.getByText("Test debt")).toBeVisible();
  });

  test("shows project name in sidebar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Alpha")).toBeVisible();
  });
});
