import { render, screen } from "@/__tests__/test-utils";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders TO_READ status correctly", () => {
    render(<StatusBadge status="TO_READ" />);
    const badge = screen.getByTestId("status-badge-to_read");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("toRead");
  });

  it("renders READING status correctly", () => {
    render(<StatusBadge status="READING" />);
    const badge = screen.getByTestId("status-badge-reading");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("reading");
  });

  it("renders READ status correctly", () => {
    render(<StatusBadge status="READ" />);
    const badge = screen.getByTestId("status-badge-read");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("read");
  });

  it("renders DROPPED status correctly", () => {
    render(<StatusBadge status="DROPPED" />);
    const badge = screen.getByTestId("status-badge-dropped");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("dropped");
  });

  it("handles different sizes", () => {
    const { rerender } = render(<StatusBadge status="READING" size="sm" />);
    let badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveClass("text-xs");

    rerender(<StatusBadge status="READING" size="md" />);
    badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveClass("text-xs");

    rerender(<StatusBadge status="READING" size="lg" />);
    badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveClass("text-sm");
  });

  it("defaults to md size", () => {
    render(<StatusBadge status="READING" />);
    const badge = screen.getByTestId("status-badge-reading");
    expect(badge).toHaveClass("text-xs");
  });

  it("handles unknown status by defaulting to TO_READ", () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("toRead")).toBeInTheDocument();
  });
});
