import React from "react";
import { Input as ChakraInput, Steps as ChakraSteps } from "@chakra-ui/react";
import { render, screen } from "../../test-utils";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import {
  ActionBarContent,
  ActionBarCloseTrigger,
  ActionBarRoot,
} from "@/components/ui/action-bar";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Blockquote } from "@/components/ui/blockquote";
import {
  BreadcrumbCurrentLink,
  BreadcrumbLink,
  BreadcrumbRoot,
} from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { CloseButton } from "@/components/ui/close-button";
import { DataListItem, DataListRoot } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { LinkButton } from "@/components/ui/link-button";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import {
  NumberInputField,
  NumberInputLabel,
  NumberInputRoot,
} from "@/components/ui/number-input";
import { PinInput, PinInputField } from "@/components/ui/pin-input";
import {
  ProgressCircleRoot,
  ProgressCircleRing,
} from "@/components/ui/progress-circle";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { RadioCardItem, RadioCardRoot } from "@/components/ui/radio-card";
import { Rating } from "@/components/ui/rating";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Splitter, SplitterPanel } from "@/components/ui/splitter";
import {
  StatDownTrend,
  StatHelpText,
  StatLabel,
  StatRoot,
  StatUpTrend,
  StatValueText,
  StatValueUnit,
} from "@/components/ui/stat";
import { Status } from "@/components/ui/status";
import { StepperInput } from "@/components/ui/stepper-input";
import {
  StepsCompletedContent,
  StepsContent,
  StepsIndicator,
  StepsItem,
  StepsList,
  StepsNextTrigger,
  StepsPrevTrigger,
  StepsRoot,
} from "@/components/ui/steps";
import { Switch } from "@/components/ui/switch";
import { Tag } from "@/components/ui/tag";
import { TagsInputControl, TagsInputInput, TagsInputItem, TagsInputRoot } from "@/components/ui/tags-input";
import {
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  TimelineRoot,
  TimelineTitle,
} from "@/components/ui/timeline";
import { Toggle } from "@/components/ui/toggle";
import { InfoTip, ToggleTip } from "@/components/ui/toggle-tip";
import { Tooltip } from "@/components/ui/tooltip";
import { QrCode } from "@/components/ui/qr-code";

describe("ui basic components", () => {
  it("renders basic wrappers without crashing", () => {
    render(
      <div>
        <AccordionRoot value={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionItemTrigger>Accordion</AccordionItemTrigger>
            <AccordionItemContent>Content</AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>

        <ActionBarRoot open>
          <ActionBarContent>Action content</ActionBarContent>
          <ActionBarCloseTrigger />
        </ActionBarRoot>

        <Alert title="Alert title">Alert body</Alert>

        <Avatar name="User" />
        <AvatarGroup>
          <Avatar name="One" />
          <Avatar name="Two" />
        </AvatarGroup>

        <Blockquote cite="Author">Quote</Blockquote>

        <BreadcrumbRoot separator="/">
          <BreadcrumbLink>Home</BreadcrumbLink>
          <BreadcrumbCurrentLink>Here</BreadcrumbCurrentLink>
        </BreadcrumbRoot>

        <Checkbox>Check me</Checkbox>
        <CheckboxCard label="Card" description="Description" />

        <CloseButton aria-label="Close" />

        <DataListRoot>
          <DataListItem label="Label" value="Value" />
        </DataListRoot>

        <EmptyState title="Empty" description="Nothing here" />

        <Field label="Label" helperText="Help text">
          <input aria-label="field-input" />
        </Field>

        <InputGroup startElement="Left" endElement="Right">
          <ChakraInput aria-label="input-group" />
        </InputGroup>

        <LinkButton href="#link">Link</LinkButton>

        <NativeSelectRoot>
          <NativeSelectField aria-label="native-select">
            <option>One</option>
          </NativeSelectField>
        </NativeSelectRoot>

        <NumberInputRoot defaultValue="1">
          <NumberInputLabel>Number</NumberInputLabel>
          <NumberInputField />
        </NumberInputRoot>

        <PinInput defaultValue={["1", "2"]}>
          <PinInputField />
          <PinInputField />
        </PinInput>

        <ProgressRoot value={30}>
          <ProgressBar />
        </ProgressRoot>
        <ProgressCircleRoot value={40}>
          <ProgressCircleRing />
        </ProgressCircleRoot>

        <RadioGroup defaultValue="a">
          <Radio value="a">A</Radio>
        </RadioGroup>

        <RadioCardRoot defaultValue="b">
          <RadioCardItem value="b" label="B" description="Desc" />
        </RadioCardRoot>

        <Rating value={3} />

        <SegmentedControl
          defaultValue="left"
          items={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
          ]}
        />

        <Skeleton>Loading</Skeleton>
        <SkeletonCircle size="6" />
        <SkeletonText noOfLines={2} />

        <Slider value={[25]} />

        <Splitter panels={[{ id: "pane-1" }, { id: "pane-2" }]}>
          <SplitterPanel>Pane 1</SplitterPanel>
          <SplitterPanel>Pane 2</SplitterPanel>
        </Splitter>

        <StatRoot>
          <StatLabel info="info">Label</StatLabel>
          <StatValueText value={1234} formatOptions={{ notation: "compact" }} />
          <StatValueUnit>units</StatValueUnit>
          <StatHelpText>Help</StatHelpText>
          <StatUpTrend>Up</StatUpTrend>
          <StatDownTrend>Down</StatDownTrend>
        </StatRoot>

        <Status>Active</Status>

        <StepperInput value={1} min={0} max={5} />

        <StepsRoot defaultValue={2}>
          <StepsList>
            <StepsItem value={1} title="One" />
            <StepsItem value={2} title="Two" />
            <StepsItem value={3} title="Three" />
            <ChakraSteps.Item value={4}>
              <ChakraSteps.Trigger>
                <StepsIndicator completedIcon={<span>Done</span>} />
              </ChakraSteps.Trigger>
              <ChakraSteps.Separator />
            </ChakraSteps.Item>
          </StepsList>
          <StepsContent>Step content</StepsContent>
          <StepsCompletedContent>Completed</StepsCompletedContent>
          <StepsNextTrigger>Next</StepsNextTrigger>
          <StepsPrevTrigger>Prev</StepsPrevTrigger>
        </StepsRoot>

        <Switch defaultChecked />

        <Tag>Tag</Tag>

        <TagsInputRoot defaultValue={["one"]}>
          <TagsInputControl>
            <TagsInputItem value="one">one</TagsInputItem>
            <TagsInputInput aria-label="tags-input" />
          </TagsInputControl>
        </TagsInputRoot>

        <QrCode value="https://example.com" />

        <TimelineRoot>
          <TimelineItem>
            <TimelineConnector />
            <TimelineContent>
              <TimelineTitle>Step</TimelineTitle>
            </TimelineContent>
          </TimelineItem>
        </TimelineRoot>

        <Toggle pressed>Toggle</Toggle>

        <ToggleTip content="Tip">
          <button type="button">Trigger</button>
        </ToggleTip>
        <InfoTip>Info</InfoTip>

        <Tooltip content="Tooltip">
          <button type="button">Hover</button>
        </Tooltip>
      </div>,
    );

    expect(screen.getByText("Accordion")).toBeInTheDocument();
    expect(screen.getByText("Alert title")).toBeInTheDocument();
    expect(screen.getByText("Quote")).toBeInTheDocument();
  });
});
