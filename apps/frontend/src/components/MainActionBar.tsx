import * as React from 'react';
import { Center, Stack, Grid, HStack } from '@chakra-ui/layout';
import { Button, IconButton } from '@chakra-ui/button';
import { Grid3x2GapFill } from 'react-bootstrap-icons';
import { Tooltip } from '@chakra-ui/tooltip';
import { useColorModeValue } from '@chakra-ui/color-mode';
import { useSmartTrainer } from '../context/SmartTrainerContext';
import { StartButton } from './MainActionBar/StartButton';
import { PowerControls } from './MainActionBar/PowerControls';
import { PausedWorkoutButtons } from './MainActionBar/PausedWorkoutButtons';
import { QuickPowerButton } from './MainActionBar/QuickPowerButton';
import { WorkoutControls } from './MainActionBar/WorkoutControls';
import { SelectWorkoutButton } from './MainActionBar/SelectWorkoutButton';
import { useLinkColor } from '../hooks/useLinkColor';
import { Icon } from '@chakra-ui/react';
import { RecoverWorkout } from './MainActionBar/RecoverWorkout';

export const MainActionBar = () => {
  const [showControls, setShowControls] = React.useState(false);

  const linkColor = useLinkColor();

  const {
    isConnected: smartTrainerIsConnected,
    requestPermission: connectToSmartTrainer,
  } = useSmartTrainer();

  const bgColor = useColorModeValue('gray.200', 'gray.900');
  return (
    <Center mb="5" mx="2">
      <Stack
        p="5"
        borderRadius="1em"
        bgColor={bgColor}
        pointerEvents="auto"
        width="500px"
      >
        <RecoverWorkout />
        <PausedWorkoutButtons />
        {showControls ? <WorkoutControls /> : null}
        {showControls ? <PowerControls /> : null}

        {!smartTrainerIsConnected ? (
          <Center>
            <HStack>
              <Button
                variant="link"
                color={linkColor}
                onClick={() => connectToSmartTrainer()}
              >
                Connect smart trainer
              </Button>
            </HStack>
          </Center>
        ) : null}
        <Grid templateColumns="1fr 1fr 1fr" gap="1" height="3em">
          <Center height="100%">
            <HStack>
              <SelectWorkoutButton />
              <Tooltip label="Show controls">
                <IconButton
                  aria-label="Show controls"
                  variant={showControls ? 'outline' : 'solid'}
                  onClick={() => setShowControls((current) => !current)}
                  icon={<Icon as={Grid3x2GapFill} />}
                />
              </Tooltip>
            </HStack>
          </Center>
          <Center>
            <StartButton />
          </Center>
          <Center height="100%">
            <HStack justifyContent="flex-end">
              <Tooltip label="Show controls">
                <IconButton
                  aria-label="Show controls"
                  variant={showControls ? 'outline' : 'solid'}
                  onClick={() => setShowControls((current) => !current)}
                  icon={<Icon as={Grid3x2GapFill} />}
                />
              </Tooltip>
              <QuickPowerButton />
            </HStack>
          </Center>
        </Grid>
      </Stack>
    </Center>
  );
};
