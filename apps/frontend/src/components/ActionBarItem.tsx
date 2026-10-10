import { Center, HStack, IconButton, Text } from '@chakra-ui/react';
import * as React from 'react';

interface Props {
  text: string;
  icon: React.ReactElement;
  onClick: () => void;
  iconColor?: string;
  isLoading?: boolean;
}

export const ActionBarItem = ({
  text,
  icon,
  onClick,
  iconColor,
  isLoading = false,
}: Props) => {
  const [hover, setHover] = React.useState(false);
  const color = iconColor ? { color: iconColor } : {};

  React.useEffect(() => {
    /* The onMouseLeave was not triggered when isLoading
     * got enabled/the button got disabled. */

    setHover(false);
  }, [isLoading]);

  return (
    <HStack spacing="0">
      <Center overflow="hidden" paddingRight="2">
        <Text
          fontSize="xl"
          transform={hover ? 'translate(0,0)' : 'translate(120%,0)'}
          opacity={hover ? '1' : '0'}
          overflow="hidden"
          transition="transform 0.2s ease, opacity 0.2s ease"
        >
          {text}
        </Text>
      </Center>

      <IconButton
        isLoading={isLoading}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        aria-label={text}
        icon={icon}
        fontSize="25"
        isRound
        size="lg"
        {...color}
        pointerEvents="auto"
      />
    </HStack>
  );
};
