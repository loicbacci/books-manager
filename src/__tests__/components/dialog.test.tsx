import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

jest.mock("@chakra-ui/react", () => {
  const Content = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>
    ) => <div ref={ref} {...props} />
  );
  Content.displayName = "DialogContent";

  const CloseTrigger = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLButtonElement>,
      ref: React.Ref<HTMLButtonElement>
    ) => <button ref={ref} {...props} />
  );
  CloseTrigger.displayName = "DialogCloseTrigger";

  return {
    Dialog: {
      Root: ({ children }: { children: React.ReactNode }) => (
        <div data-root>{children}</div>
      ),
      Trigger: ({ children }: { children: React.ReactNode }) => (
        <button>{children}</button>
      ),
      Backdrop: () => <div data-backdrop />,
      Positioner: ({ children }: { children: React.ReactNode }) => (
        <div data-positioner>{children}</div>
      ),
      Content,
      Header: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <h2>{children}</h2>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      CloseTrigger,
    },
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-portal>{children}</div>
    ),
    CloseButton: ({ children }: { children?: React.ReactNode }) => (
      <button>{children}</button>
    ),
  };
});

describe("Dialog components", () => {
  it("renders dialog structure", () => {
    render(
      <DialogRoot>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>Body</DialogBody>
          <DialogFooter>Footer</DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(document.querySelector("[data-backdrop]")).toBeInTheDocument();
  });
});


