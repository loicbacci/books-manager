import React from "react";
import { render, screen } from "../../test-utils";
import { createListCollection, parseColor } from "@chakra-ui/react";
import {
  ClipboardButton,
  ClipboardInput,
  ClipboardLabel,
  ClipboardRoot,
} from "@/components/ui/clipboard";
import {
  CarouselControls,
  CarouselItem,
  CarouselItemGroup,
  CarouselRoot,
} from "@/components/ui/carousel";
import {
  ColorPickerArea,
  ColorPickerChannelInputs,
  ColorPickerChannelSliders,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropper,
  ColorPickerInlineContent,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPickerSwatchGroup,
  ColorPickerSwatchTrigger,
  ColorPickerSliders,
  ColorPickerTrigger,
  ColorPickerValueSwatch,
  ColorPickerValueText,
} from "@/components/ui/color-picker";
import {
  ComboboxControl,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemGroup,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxRoot,
} from "@/components/ui/combobox";
import {
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  FileInput,
  FileUploadDropzone,
  FileUploadList,
  FileUploadRoot,
} from "@/components/ui/file-upload";
import {
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  MenuArrow,
  MenuCheckboxItem,
  MenuContent,
  MenuItemGroup,
  MenuItem,
  MenuRoot,
  MenuRadioItemGroup,
  MenuRadioItem,
  MenuTrigger,
  MenuTriggerItem,
} from "@/components/ui/menu";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import {
  PopoverArrow,
  PopoverBody,
  PopoverCloseTrigger,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Prose } from "@/components/ui/prose";
import { Provider } from "@/components/ui/provider";
import {
  ColorModeButton,
  ColorModeIcon,
  ColorModeProvider,
  DarkMode,
  LightMode,
  useColorMode,
  useColorModeValue,
} from "@/components/ui/color-mode";

describe("ui complex components", () => {
  it("renders composite components with minimal props", () => {
    const comboCollection = createListCollection({
      items: [{ value: "one", label: "One" }],
    });
    const emptyCollection = createListCollection({
      items: [],
    });

    const testFile = new File(["hello"], "hello.txt", { type: "text/plain" });

    render(
      <div>
        <ClipboardRoot value="https://example.com">
          <ClipboardLabel>Copy link</ClipboardLabel>
          <ClipboardInput aria-label="clipboard-input" />
          <ClipboardButton>Copy</ClipboardButton>
        </ClipboardRoot>

        <CarouselRoot withAutoplay slideCount={2}>
          <CarouselItemGroup>
            <CarouselItem index={0}>Slide 1</CarouselItem>
            <CarouselItem index={1}>Slide 2</CarouselItem>
          </CarouselItemGroup>
          <CarouselControls />
        </CarouselRoot>

        <ColorPickerRoot defaultValue={parseColor("#000000")}>
          <ColorPickerLabel>Pick a color</ColorPickerLabel>
          <ColorPickerControl>
            <ColorPickerTrigger />
            <ColorPickerValueText />
            <ColorPickerValueSwatch />
          </ColorPickerControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerSliders />
            <ColorPickerChannelInputs format="rgba" />
            <ColorPickerChannelSliders format="hsla" />
            <ColorPickerInput aria-label="hex-input" />
            <ColorPickerEyeDropper aria-label="dropper" />
            <ColorPickerSwatchGroup>
              <ColorPickerSwatchTrigger value="#ff0000" />
            </ColorPickerSwatchGroup>
          </ColorPickerContent>
          <ColorPickerInlineContent>
            <div>Inline</div>
          </ColorPickerInlineContent>
        </ColorPickerRoot>

        <ComboboxRoot collection={comboCollection}>
          <ComboboxLabel>Choose</ComboboxLabel>
          <ComboboxControl clearable>
            <ComboboxInput aria-label="combobox" />
          </ComboboxControl>
          <ComboboxContent>
            <ComboboxItemGroup label="Group">
              {comboCollection.items.map((item) => (
                <ComboboxItem key={item.value} item={item}>
                  <ComboboxItemText>{item.label}</ComboboxItemText>
                </ComboboxItem>
              ))}
            </ComboboxItemGroup>
          </ComboboxContent>
        </ComboboxRoot>

        <ComboboxRoot collection={emptyCollection}>
          <ComboboxInput aria-label="combobox-empty" />
          <ComboboxContent>
            <ComboboxEmpty>No items</ComboboxEmpty>
          </ComboboxContent>
        </ComboboxRoot>

        <DrawerRoot open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>Body</DrawerBody>
            <DrawerCloseTrigger />
          </DrawerContent>
        </DrawerRoot>

        <FileUploadRoot>
          <FileUploadDropzone label="Upload" description="Drop files" />
          <FileInput />
          <FileUploadList files={[testFile]} showSize clearable />
        </FileUploadRoot>

        <HoverCardRoot open>
          <HoverCardTrigger>
            <button type="button">Hover</button>
          </HoverCardTrigger>
          <HoverCardContent>Hover card</HoverCardContent>
        </HoverCardRoot>

        <MenuRoot open>
          <MenuTrigger>
            <button type="button">Open</button>
          </MenuTrigger>
          <MenuContent>
            <MenuArrow />
            <MenuItem value="item">Item</MenuItem>
            <MenuCheckboxItem value="checked" checked>
              Checked
            </MenuCheckboxItem>
            <MenuRadioItemGroup value="one">
              <MenuRadioItem value="one">Radio</MenuRadioItem>
            </MenuRadioItemGroup>
            <MenuItemGroup title="Group">
              <MenuTriggerItem startIcon={<span>+</span>} value="more">
                More
              </MenuTriggerItem>
            </MenuItemGroup>
          </MenuContent>
        </MenuRoot>

        <PaginationRoot count={20} pageSize={5} page={1}>
          <PaginationPrevTrigger />
          <PaginationItems />
          <PaginationNextTrigger />
          <PaginationPageText />
        </PaginationRoot>

        <PasswordInput placeholder="Password" />
        <PasswordStrengthMeter value={2} />

        <PopoverRoot open>
          <PopoverTrigger>
            <button type="button">Popover</button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverHeader>
              <PopoverTitle>Title</PopoverTitle>
              <PopoverDescription>Description</PopoverDescription>
            </PopoverHeader>
            <PopoverBody>Body</PopoverBody>
            <PopoverFooter>Footer</PopoverFooter>
            <PopoverCloseTrigger />
          </PopoverContent>
        </PopoverRoot>

        <Prose>
          <p>Prose content</p>
        </Prose>

        <Provider>
          <div>Provider content</div>
        </Provider>

        <ColorModeProvider>
          <ColorModeButton />
          <LightMode>Light</LightMode>
          <DarkMode>Dark</DarkMode>
          <ColorModeProbe />
        </ColorModeProvider>
      </div>,
    );

    expect(screen.getByText("Copy link")).toBeInTheDocument();
    expect(screen.getByText("Drawer")).toBeInTheDocument();
    expect(screen.getByText("Hover card")).toBeInTheDocument();
  });
});

function ColorModeProbe() {
  const { colorMode } = useColorMode();
  const variant = useColorModeValue("light", "dark");
  return (
    <span>
      <ColorModeIcon />
      {colorMode}-{variant}
    </span>
  );
}


