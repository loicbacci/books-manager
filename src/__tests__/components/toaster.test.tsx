import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Toaster, toaster } from "@/components/ui/toaster";

jest.mock("@chakra-ui/react", () => {
  return {
    createToaster: () => ({ create: jest.fn() }),
    Toaster: ({
      children,
    }: {
      children: (toast: {
        type: string;
        title?: string;
        description?: string;
        action?: { label: string };
        closable?: boolean;
      }) => React.ReactNode;
    }) => (
      <div data-toaster>
        {children({
          type: "loading",
          title: "Loading",
          closable: true,
        })}
        {children({
          type: "success",
          title: "Done",
          description: "Saved",
          action: { label: "Undo" },
          closable: true,
        })}
      </div>
    ),
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-portal>{children}</div>
    ),
    Spinner: () => <div data-spinner />,
    Stack: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Toast: {
      Root: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Indicator: () => <div data-indicator />,
      Title: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      ActionTrigger: ({ children }: { children: React.ReactNode }) => (
        <button>{children}</button>
      ),
      CloseTrigger: () => <button>Close</button>,
    },
  };
});

describe("Toaster", () => {
  it("renders toasts with loading and success states", () => {
    render(<Toaster />);

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(document.querySelector("[data-spinner]")).toBeInTheDocument();
    expect(document.querySelector("[data-indicator]")).toBeInTheDocument();
  });

  it("exports a toaster instance", () => {
    expect(toaster).toBeDefined();
  });
});


