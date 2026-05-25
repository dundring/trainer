import { Box, Center, Text } from '@chakra-ui/layout';
import { CloseButton, keyframes } from '@chakra-ui/react';
import { useMigrationModal } from '../context/ModalContext';

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const MigrationBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { onOpen } = useMigrationModal();

  return (
    <Center
      width="100%"
      position="fixed"
      top="0"
      zIndex="banner"
      background="linear-gradient(135deg, #92c4ea, #716fac, #92c4ea, #716fac)"
      backgroundSize="300% 100%"
      animation={`${gradientShift} 14s ease infinite`}
      color="black"
      py="1"
      fontSize="sm"
      fontWeight="semibold"
    >
      <Text cursor="pointer" onClick={onOpen} textAlign="center" px="10">
        We're moving this page to trainer.dundring.com – read more here!
      </Text>
      <Box position="absolute" right="2">
        <CloseButton size="sm" onClick={onDismiss} />
      </Box>
    </Center>
  );
};
