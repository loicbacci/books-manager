import { render, screen } from "@/__tests__/test-utils";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders TO_READ status correctly", () => {
    render(<StatusBadge status="TO_READ" />);
    const badge = screen.getByTestId("status-badge-to_read");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("To Read");
  });

  it("renders READING status correctly", () => {
    render(<StatusBadge status="READING" />);
    const badge = screen.getByTestId("status-badge-reading");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Reading");
  });

  it("renders READ status correctly", () => {
    render(<StatusBadge status="READ" />);
    const badge = screen.getByTestId("status-badge-read");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Read");
  });

  it("renders DROPPED status correctly", () => {
    render(<StatusBadge status="DROPPED" />);
    const badge = screen.getByTestId("status-badge-dropped");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Dropped");
  });

  it("handles different sizes", () => {
    const { rerender } = render(<StatusBadge status="READING" size="sm" />);
    let badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveStyle({ fontSize: "xs" });

    rerender(<StatusBadge status="READING" size="md" />);
    badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveStyle({ fontSize: "sm" });

    rerender(<StatusBadge status="READING" size="lg" />);
    badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveStyle({ fontSize: "md" });
  });

  it("defaults to md size", () => {
    render(<StatusBadge status="READING" />);
    const badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveStyle({ fontSize: "sm" });
  });

  it("handles unknown status by defaulting to TO_READ", () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    // Should render but with TO_READ config as fallback
    expect(screen.getByText("To Read")).toBeInTheDocument();
  });
});


