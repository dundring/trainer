import * as React from 'react';
import { Checkbox, Stack, Text } from '@chakra-ui/react';
import { hrColorsAsStrings, powerColorsAsStrings } from '../../colors';
import { ShowData } from './GraphContainer';

interface Props {
  title: string;
  index?: number;
  setChecked: (checked: ShowData) => void;
  checked: ShowData;
}
export const GraphCheckboxes = ({
  title,
  index,
  checked,
  setChecked,
}: Props) => {
  const modIndex = index ? index % hrColorsAsStrings.length : 0;
  const hrColorScheme = hrColorsAsStrings[modIndex];
  const powerColorScheme = powerColorsAsStrings[modIndex];
  return (
    <Stack>
      <Text fontWeight="bold">{title}</Text>
      <Checkbox
        colorScheme={hrColorScheme}
        onChange={(e) => {
          setChecked({ ...checked, hr: e.target.checked });
        }}
        isChecked={checked.hr}
      >
        HR
      </Checkbox>
      <Checkbox
        colorScheme={powerColorScheme}
        onChange={(e) => {
          setChecked({ ...checked, power: e.target.checked });
        }}
        isChecked={checked.power}
      >
        Power
      </Checkbox>
    </Stack>
  );
};
