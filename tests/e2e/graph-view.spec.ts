import { expect, test } from "@playwright/test";
import { setupCommonRoutes, waitForAppReady, TEST_PROJECT } from "./helpers";

test.describe("graph view page", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
  });

  test("navigates to graph page via sidebar", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/overview`);
    await waitForAppReady(page);

    // Click the Graph nav item
    await page.getByRole("link", { name: "Graph", exact: true }).first().click();
    await page.waitForURL(new RegExp(`/${TEST_PROJECT.id}/graph`), { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Graph View", level: 1 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows node and edge counts in header", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/graph`);
    await waitForAppReady(page);

    await expect(
      page.getByRole("heading", { name: "Graph View", level: 1 })
    ).toBeVisible({ timeout: 10_000 });

    // The header shows "5 nodes, 4 edges"
    await expect(page.getByText("5 nodes, 4 edges")).toBeVisible({ timeout: 10_000 });
  });

  test("shows stats cards when expanded", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/graph`);
    await waitForAppReady(page);

    await expect(
      page.getByRole("heading", { name: "Graph View", level: 1 })
    ).toBeVisible({ timeout: 10_000 });

    // Click "Show Stats" button
    await page.getByRole("button", { name: /Show Stats/ }).click();

    // Verify cards appear
    await expect(page.getByText("Nodes").first()).toBeVisible();
    await expect(page.getByText("Edges").first()).toBeVisible();
    await expect(page.getByText("Clusters").first()).toBeVisible();
  });

  test("filter panel is visible and toggleable", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/graph`);
    await waitForAppReady(page);

    await expect(
      page.getByRole("heading", { name: "Graph View", level: 1 })
    ).toBeVisible({ timeout: 10_000 });

    // Filter panel should be visible by default
    await expect(page.getByText("Filters")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Node Types")).toBeVisible();

    // Toggle collapse
    await page.getByRole("button", { name: /Filters/ }).click();
    await expect(page.getByText("Node Types")).not.toBeVisible();
  });

  test("legend shows node types", async ({ page }) => {
    await page.goto(`/${TEST_PROJECT.id}/graph`);
    await waitForAppReady(page);

    await expect(
      page.getByRole("heading", { name: "Graph View", level: 1 })
    ).toBeVisible({ timeout: 10_000 });

    // Legend should show node type labels
    await expect(page.getByText("Legend")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Sprint").first()).toBeVisible();
    await expect(page.getByText("Finding").first()).toBeVisible();
    await expect(page.getByText("Document").first()).toBeVisible();
  });
});
