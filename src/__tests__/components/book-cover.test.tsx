/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@/__tests__/test-utils";
import { BookCover } from "@/components/ui/book-cover";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt} src={props.src} />
  ),
}));

describe("BookCover", () => {
  it("renders an image when coverUrl is provided", () => {
    render(<BookCover coverUrl="https://example.com/cover.jpg" title="Book" />);

    expect(screen.getByAltText("Book")).toBeInTheDocument();
  });

  it("renders a fallback icon when coverUrl is missing", () => {
    render(<BookCover coverUrl={null} title="Book" size="sm" />);

    expect(screen.getByText("📕")).toBeInTheDocument();
  });
});


