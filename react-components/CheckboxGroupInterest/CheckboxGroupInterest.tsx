import {
  Checkbox,
  CheckboxGroup,
  Description,
  Label,
  Surface,
} from "@heroui/react";

export type CheckboxGroupInterestProps = {
  name?: string;
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  /** Hide group Label/Description when the parent step already shows a heading. */
  showHeading?: boolean;
};

export function CheckboxGroupInterest({
  name = "interests",
  defaultValue,
  value,
  onValueChange,
  showHeading = true,
}: CheckboxGroupInterestProps) {
  return (
    <Surface className="w-full rounded-3xl p-6">
      <CheckboxGroup
        name={name}
        variant="secondary"
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onValueChange}
      >
        {showHeading ? (
          <>
            <Label>علاقه‌مندی‌های خود را انتخاب کنید</Label>
            <Description>همهٔ موارد مرتبط را برگزینید</Description>
          </>
        ) : null}
        <Checkbox value="coding">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            برنامه‌نویسی
          </Checkbox.Content>
          <Description>علاقه‌مند به ساخت نرم‌افزار</Description>
        </Checkbox>
        <Checkbox value="design">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            طراحی
          </Checkbox.Content>
          <Description>علاقه‌مند به ساخت رابط‌های زیبا</Description>
        </Checkbox>
        <Checkbox value="writing">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            نویسندگی
          </Checkbox.Content>
          <Description>علاقه‌مند به تولید محتوا</Description>
        </Checkbox>
      </CheckboxGroup>
    </Surface>
  );
}
