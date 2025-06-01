import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Helper function to select an option from a shadcn/ui Select component.
 * Assumes the SelectTrigger is identifiable by its accessible name (via aria-label or label association).
 * Assumes SelectItems are identifiable by their text content.
 *
 * @param user - The userEvent instance.
 * @param selectLabel - RegExp or string to find the SelectTrigger by its accessible name.
 * @param optionText - RegExp or string for the text of the option to select.
 */
export async function selectShadcnOption(
  user: ReturnType<typeof userEvent.setup>,
  selectLabel: RegExp | string,
  optionText: RegExp | string
) {
  const selectTrigger = screen.getByRole("combobox", { name: selectLabel });
  await user.click(selectTrigger);
  const option = await screen.findByRole("option", { name: optionText });
  await user.click(option);
  // Optionally, to ensure the UI has updated if the trigger reflects the value:
  // await waitFor(() => expect(selectTrigger).toHaveTextContent(optionText));
}
