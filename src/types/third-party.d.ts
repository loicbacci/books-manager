import type * as React from "react";

declare module "@tiptap/pm/state" {
  export class PluginKey {
    constructor(name?: string);
  }
}

declare module "@tiptap/react" {
  export type EditorChain = {
    focus: () => EditorChain;
    run: () => void;
    setMark: (name: string, attrs?: Record<string, unknown>) => EditorChain;
    unsetMark: (name: string) => EditorChain;
    setParagraph: () => EditorChain;
    toggleHeading: (options: { level: number }) => EditorChain;
    toggleBulletList: () => EditorChain;
    toggleOrderedList: () => EditorChain;
    toggleBlockquote: () => EditorChain;
    setHorizontalRule: () => EditorChain;
    toggleBold: () => EditorChain;
    toggleItalic: () => EditorChain;
    toggleUnderline: () => EditorChain;
    toggleStrike: () => EditorChain;
    toggleCode: () => EditorChain;
    toggleSubscript: () => EditorChain;
    toggleSuperscript: () => EditorChain;
    toggleHighlight: (options?: { color?: string }) => EditorChain;
    unsetHighlight: () => EditorChain;
    setFontFamily: (value: string) => EditorChain;
    unsetFontFamily: () => EditorChain;
    setTextAlign: (value: string) => EditorChain;
    extendMarkRange: (name: string) => EditorChain;
    setLink: (attrs: { href: string }) => EditorChain;
    unsetLink: () => EditorChain;
    undo: () => EditorChain;
    redo: () => EditorChain;
  };

  export type Editor = {
    chain: () => EditorChain;
    can: () => { undo: () => boolean; redo: () => boolean };
    isActive: (...args: unknown[]) => boolean;
    getAttributes: (name: string) => Record<string, string | undefined>;
  };

  export const EditorContent: React.FC<
    React.ComponentProps<"div"> & {
      editor?: Editor | null;
      innerRef?: React.Ref<HTMLDivElement>;
    }
  >;

  export class ReactRenderer<TElement = HTMLElement, P = unknown> {
    constructor(
      component: React.ComponentType<P>,
      options: { props: P; editor?: Editor }
    );
    element: TElement;
    props: P;
    updateProps: (props: Partial<P>) => void;
    destroy: () => void;
  }
}
