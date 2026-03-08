import { expect, test } from "@playwright/test";
import { setupCommonRoutes, navigateTo, waitForAppReady, TEST_PROJECT } from "./helpers";

test.describe("sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
  });

  test("redirects to first project overview on load", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(new RegExp(`/${TEST_PROJECT.id}/overview`), { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: TEST_PROJECT.name, level: 1 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navigates through main nav items", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);

    const navSteps = [
      { label: "Sprints", heading: "Sprints", path: "sprints" },
      { label: "Findings", heading: "Findings", path: "findings" },
      { label: "Roadmap", heading: "Roadmap", path: "roadmap" },
      { label: "Debt", heading: "Technical Debt", path: "debt" },
      { label: "Documents", heading: "Documents", path: "documents" },
    ];

    for (const step of navSteps) {
      await navigateTo(page, step.label);
      await page.waitForURL(new RegExp(`/${TEST_PROJECT.id}/${step.path}`), { timeout: 10_000 });
      await expect(page.getByRole("heading", { name: step.heading, level: 1 })).toBeVisible({ timeout: 10_000 });
    }

    await navigateTo(page, "Overview");
    await page.waitForURL(new RegExp(`/${TEST_PROJECT.id}/overview`), { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: TEST_PROJECT.name, level: 1 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows workspace name in sidebar", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);
    await expect(page.getByText("Kyro E2E")).toBeVisible();
  });

  test("shows project name in sidebar", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);
    await expect(page.locator("aside").getByText(TEST_PROJECT.name).first()).toBeVisible();
  });
});

test.describe("sprint drill-down", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto(`/${TEST_PROJECT.id}/sprints`);
    await waitForAppReady(page);
  });

  test("navigates from sprint list to kanban board via Board button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sprints", level: 1 })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Board" }).nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/sprints/sprint-2`));
    await expect(page.getByText("Pending")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("navigates from sprint list to sprint detail via Details button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sprints", level: 1 })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Details" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/sprints/sprint-1/detail`));
    await expect(page.getByRole("heading", { name: /Sprint 1/ })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("finding drill-down", () => {
  test("displays findings list", async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto(`/${TEST_PROJECT.id}/findings`);
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: "Findings", level: 1 })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Architecture Layer Violations")).toBeVisible();
  });
});
