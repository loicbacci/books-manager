import { fireEvent, render, screen } from "@/__tests__/test-utils";
import { GroupToggle } from "@/components/ui/group-toggle";

describe("GroupToggle", () => {
  it("renders label and toggles on click", () => {
    const onToggle = jest.fn();

    render(
      <GroupToggle label="My Group" collapsed onToggle={onToggle} size="sm" />
    );

    expect(screen.getByText("My Group")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders expanded state icon", () => {
    render(<GroupToggle label="Expanded" collapsed={false} onToggle={() => {}} />);

    expect(screen.getByText("Expanded")).toBeInTheDocument();
  });
});


