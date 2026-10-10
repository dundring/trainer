import {
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import { powerColors } from '../../colors';

interface Payload {
  name: string;
  value: number;
}

interface Props {
  active?: boolean;
  payload?: Payload[];
}

const formatLine = (name: string, value: number) => {
  const unit = name.split(' ')[1] === 'HR' ? ' bpm' : ' W';
  return [`${name.split(' ')[0]}`, value, unit];
};
export const CustomChartTooltip = ({ active, payload }: Props) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  if (active && payload && payload.length) {
    return (
      <Table bgColor={bgColor} borderRadius="5" variant="unstyled">
        <Tbody>
          {payload.map((dataPoint, i) => {
            const [name, value, unit] = formatLine(
              dataPoint.name,
              dataPoint.value
            );

            return (
              <Tr key={i}>
                <Td p="0">
                  <Text
                    color={powerColors[i % powerColors.length]}
                    align="right"
                    p="1"
                  >
                    {name}:
                  </Text>
                </Td>
                <Td p="0">
                  <Text
                    color={powerColors[i % powerColors.length]}
                    align="right"
                    fontWeight="bold"
                    paddingY="1"
                  >
                    {value}
                  </Text>
                </Td>
                <Td p="0">
                  <Text
                    color={powerColors[i % powerColors.length]}
                    paddingY="1"
                    pr="1"
                  >
                    {' '}
                    {unit}
                  </Text>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  }

  return null;
};
