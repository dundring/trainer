import {
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';

interface Payload {
  name: string;
  value: number;
  color: string;
}

interface Props {
  active?: boolean;
  payload?: Payload[];
}

const formatLine = (label: string, value: number) => {
  const unit = label.split(' ')[1] === 'HR' ? ' bpm' : ' W';
  const name = label.split(' ')[0];
  return [`${name === 'You-Untracked' ? 'You' : name}`, value, unit];
};
export const CustomGraphTooltip = ({ active, payload }: Props) => {
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
                  <Text color={dataPoint.color} align="right" p="1">
                    {name}:
                  </Text>
                </Td>
                <Td p="0">
                  <Text
                    color={dataPoint.color}
                    align="right"
                    fontWeight="bold"
                    paddingY="1"
                  >
                    {value}
                  </Text>
                </Td>
                <Td p="0">
                  <Text color={dataPoint.color} paddingY="1" pr="1">
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
