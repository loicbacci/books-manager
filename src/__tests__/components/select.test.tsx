import * as React from "react";
import type { ListCollection } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

jest.mock("@chakra-ui/react", () => {
  const Trigger = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLButtonElement>,
      ref: React.Ref<HTMLButtonElement>
    ) => <button ref={ref} {...props} />
  );
  Trigger.displayName = "SelectTrigger";

  const Content = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>
    ) => <div ref={ref} {...props} />
  );
  Content.displayName = "SelectContent";

  const Item = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>
    ) => <div ref={ref} {...props} />
  );
  Item.displayName = "SelectItem";

  return {
    Select: {
      Root: ({ children }: { children: React.ReactNode }) => (
        <div data-root>{children}</div>
      ),
      Trigger,
      Indicator: () => <span data-indicator />,
      ValueText: ({ children }: { children?: React.ReactNode }) => (
        <span>{children}</span>
      ),
      Content,
      Positioner: ({ children }: { children: React.ReactNode }) => (
        <div data-positioner>{children}</div>
      ),
      Item,
      ItemIndicator: () => <span data-item-indicator />,
    },
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-portal>{children}</div>
    ),
  };
});

describe("Select components", () => {
  it("renders trigger, content, and item indicators", () => {
    const collection = {
      items: [],
      itemToString: () => "",
      itemToValue: () => "",
    } as unknown as ListCollection<unknown>;

    render(
      <SelectRoot collection={collection}>
        <SelectTrigger>
          <SelectValueText>Selected</SelectValueText>
        </SelectTrigger>
        <SelectContent>
          <SelectItem item={{}}>
            Item Label
          </SelectItem>
        </SelectContent>
      </SelectRoot>
    );

    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByText("Item Label")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-indicator]").length).toBe(1);
    expect(document.querySelectorAll("[data-item-indicator]").length).toBe(1);
  });
});


