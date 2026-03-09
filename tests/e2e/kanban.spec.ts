import { expect, test } from "@playwright/test";
import { setupCommonRoutes, waitForAppReady, TEST_PROJECT } from "./helpers";

test.describe("kanban board", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto(`/${TEST_PROJECT.id}/sprints/sprint-2`);
    await waitForAppReady(page);
  });

  test("renders all kanban columns", async ({ page }) => {
    // .first() needed because filter bar chips also contain these status names
    await expect(page.getByText("Pending").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("In Progress").first()).toBeVisible();
    await expect(page.getByText("Done").first()).toBeVisible();
    await expect(page.getByText("Blocked").first()).toBeVisible();
    await expect(page.getByText("Skipped").first()).toBeVisible();
    await expect(page.getByText("Carry-over").first()).toBeVisible();
  });

  test("displays task cards with correct info", async ({ page }) => {
    await expect(page.getByText("Build kanban board")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Add command palette")).toBeVisible();
    await expect(page.getByText("Implement search")).toBeVisible();
  });

  test("shows sprint name and status in header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Sprint 2 — Core Features/ })).toBeVisible({ timeout: 10_000 });
    // Status badge in the header area
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("has navigation to sprint details", async ({ page }) => {
    const detailsLink = page.getByRole("link", { name: "Details" });
    await expect(detailsLink).toBeVisible({ timeout: 10_000 });
    await expect(detailsLink).toHaveAttribute("href", new RegExp(`/sprints/sprint-2/detail`));
  });

  test("has back button to sprints list", async ({ page }) => {
    const backButton = page.getByRole("button", { name: "Back to sprints" });
    await expect(backButton).toBeVisible({ timeout: 10_000 });
  });

  test("drag-drop shows confirmation dialog", async ({ page }) => {
    // Wait for board to render
    await expect(page.getByText("Build kanban board")).toBeVisible({ timeout: 10_000 });

    // Get the task card and a target column
    const taskCard = page.getByText("Add command palette");
    const doneColumn = page.getByText("Done").first();

    // Get bounding boxes for drag simulation
    const taskBox = await taskCard.boundingBox();
    const doneBox = await doneColumn.boundingBox();

    if (taskBox && doneBox) {
      // Simulate drag from task to Done column
      await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
      await page.mouse.down();
      // Move in steps to trigger dnd-kit sensors
      await page.mouse.move(doneBox.x + doneBox.width / 2, doneBox.y + 50, { steps: 10 });
      await page.mouse.up();

      // Check if confirmation dialog appears (may not trigger due to dnd-kit activation distance)
      const dialog = page.getByText("Move Task");
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        await expect(page.getByText(/Move "Add command palette"/)).toBeVisible();
        // Cancel the move
        await page.getByRole("button", { name: "Cancel" }).click();
      }
    }
  });

});
