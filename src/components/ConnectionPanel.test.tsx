import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_CONNECTION_SETTINGS } from "../constants";
import { ConnectionPanel } from "./ConnectionPanel";

describe("ConnectionPanel", () => {
  it("emits edited connection values and exposes the storage warning", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConnectionPanel
        value={DEFAULT_CONNECTION_SETTINGS}
        storageWarning
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Model"), "demo-model");

    expect(onChange).toHaveBeenCalledWith("model", "d");
    expect(screen.getByRole("status")).toHaveTextContent("localStorage");
  });
});
