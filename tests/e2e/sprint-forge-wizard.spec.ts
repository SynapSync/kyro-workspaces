import { expect, test } from "@playwright/test";
import { setupCommonRoutes, waitForAppReady, TEST_PROJECT } from "./helpers";

test.describe("sprint forge wizard", () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
    await page.goto(`/${TEST_PROJECT.id}/roadmap`);
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Roadmap", level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test("opens from roadmap page via Generate Next Sprint button", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Next Sprint/ }).click();

    // Wizard dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Generate Sprint/)).toBeVisible();
  });

  test("navigates through all 4 wizard steps", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Next Sprint/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Step 1: Findings — should show available findings
    await expect(dialog.getByText("Architecture Layer Violations")).toBeVisible();

    // Select a finding if checkbox available
    const checkbox = dialog.locator("input[type='checkbox']").first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }

    // Go to Step 2: Debt
    await dialog.getByRole("button", { name: "Next" }).click();

    // Go to Step 3: Config
    await dialog.getByRole("button", { name: "Next" }).click();
    await expect(dialog.getByText(/Version Target/i)).toBeVisible();

    // Fill version
    const versionInput = dialog.locator("input").first();
    if (await versionInput.isVisible()) {
      await versionInput.fill("3.2.0");
    }

    // Go to Step 4: Preview
    await dialog.getByRole("button", { name: "Next" }).click();

    // Preview should show composed prompt in a pre block
    await expect(dialog.locator("pre")).toBeVisible();
  });

  test("can navigate back through steps", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Next Sprint/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Go to step 2
    await dialog.getByRole("button", { name: "Next" }).click();

    // Go back to step 1
    await dialog.getByRole("button", { name: "Back" }).click();
    await expect(dialog.getByText("Architecture Layer Violations")).toBeVisible();
  });

  test("preview step shows copy button", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Next Sprint/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Navigate to preview step (step 4)
    for (let i = 0; i < 3; i++) {
      await dialog.getByRole("button", { name: "Next" }).click();
    }

    // Copy button should be visible on preview step
    await expect(dialog.getByRole("button", { name: /Copy/ }).first()).toBeVisible();
  });
});
