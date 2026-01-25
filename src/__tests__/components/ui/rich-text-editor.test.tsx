import React from "react";
import { render, screen } from "../../test-utils";
import { RichTextEditor, Control } from "@/components/ui/rich-text-editor";
import { useEditorMenu, MentionMenu } from "@/components/ui/rich-text-editor-menu";

jest.mock("@tiptap/react", () => ({
  EditorContent: (props: { children?: React.ReactNode }) => (
    <div data-testid="editor-content">{props.children}</div>
  ),
  ReactRenderer: class {},
}));

const createMockEditor = () => {
  const chain = {
    focus: () => chain,
    run: () => {},
    setMark: () => chain,
    unsetMark: () => chain,
    setParagraph: () => chain,
    toggleHeading: () => chain,
    toggleBulletList: () => chain,
    toggleOrderedList: () => chain,
    toggleBlockquote: () => chain,
    setHorizontalRule: () => chain,
    toggleBold: () => chain,
    toggleItalic: () => chain,
    toggleUnderline: () => chain,
    toggleStrike: () => chain,
    toggleCode: () => chain,
    toggleSubscript: () => chain,
    toggleSuperscript: () => chain,
    toggleHighlight: () => chain,
    unsetHighlight: () => chain,
    setFontFamily: () => chain,
    unsetFontFamily: () => chain,
    setTextAlign: () => chain,
    extendMarkRange: () => chain,
    setLink: () => chain,
    unsetLink: () => chain,
    undo: () => chain,
    redo: () => chain,
  };

  return {
    chain: () => chain,
    can: () => ({ undo: () => true, redo: () => true }),
    isActive: () => false,
    getAttributes: () => ({}),
  };
};

describe("rich text editor components", () => {
  it("renders toolbar controls and content with a mock editor", () => {
    const editor = createMockEditor();

    render(
      <RichTextEditor.Root editor={editor}>
        <RichTextEditor.Toolbar>
          <RichTextEditor.ControlGroup>
            <Control.Bold />
            <Control.Italic />
            <Control.FontSize />
            <Control.TextStyle />
            <Control.TextColor />
          </RichTextEditor.ControlGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
        <RichTextEditor.Footer>Footer</RichTextEditor.Footer>
      </RichTextEditor.Root>,
    );

    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders editor menu hooks and menu components", () => {
    const MenuHook = () => {
      const { selectedIndex } = useEditorMenu();
      return <div>Index: {selectedIndex}</div>;
    };

    render(
      <div>
        <MenuHook />
        <MentionMenu
          items={[{ id: "1", label: "User", email: "user@example.com" }]}
          selectedIndex={0}
          onSelect={() => {}}
          clientRect={() => new DOMRect(0, 0, 10, 10)}
        />
      </div>,
    );

    expect(screen.getByText("Index: 0")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });
});


