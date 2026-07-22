import { render, screen } from "@//__tests__/test-utils";
import { ProgressBar } from "@/components/ui/progress-bar";

describe("ProgressBar", () => {
  it("renders with value prop", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });

  it("calculates percentage from current and total", () => {
    render(<ProgressBar current={50} total={100} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows 0% when total is null", () => {
    render(<ProgressBar current={50} total={null} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows 0% when total is 0", () => {
    render(<ProgressBar current={50} total={0} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps percentage to 100% when current exceeds total", () => {
    render(<ProgressBar current={150} total={100} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("shows 0% for negative current page", () => {
    render(<ProgressBar current={-10} total={100} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("displays label when showLabel is true", () => {
    render(<ProgressBar current={50} total={100} showLabel={true} />);
    expect(screen.getByText("50 / 100 pages")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("hides label when showLabel is false", () => {
    render(<ProgressBar current={50} total={100} showLabel={false} />);
    expect(screen.queryByText("50 / 100 pages")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("shows ? for total when total is null in label", () => {
    render(<ProgressBar current={50} total={null} showLabel={true} />);
    expect(screen.getByText("50 / ? pages")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    let progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("h-2");

    rerender(<ProgressBar value={50} size="md" />);
    progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("h-3");

    rerender(<ProgressBar value={50} size="lg" />);
    progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("h-4");
  });

  it("uses primary fill color", () => {
    render(<ProgressBar value={50} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill).toHaveClass("bg-primary");
  });

  it("has proper accessibility attributes", () => {
    render(<ProgressBar current={75} total={300} />);
    const progressBar = screen.getByRole("progressbar");

    expect(progressBar).toHaveAttribute("aria-valuenow", "25");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-label", "Reading progress: 25%");
  });

  it("rounds percentage to nearest integer", () => {
    render(<ProgressBar current={1} total={3} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "33");
  });
});


