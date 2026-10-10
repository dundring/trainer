import {
  Button,
  Center,
  Grid,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAvailability } from '../hooks/useAvailability';
import { Logo } from './Logo';
import { Github, MoonFill, Slack, SunFill } from 'react-bootstrap-icons';
import { MainActionBar } from './MainActionBar';
import { Link as ReachLink, useNavigate } from 'react-router-dom';
import { useLogs } from '../context/LogContext';
import { githubRepo, slackInvite } from '../links';
import { useWelcomeMessageModal } from '../context/ModalContext';
import { useEffect, useState } from 'react';
import { seconds } from '@dundring/utils';

export const BottomBar = () => {
  const { colorMode, setColorMode } = useColorMode();
  const { available: bluetoothIsAvailable } = useAvailability();
  const { loggedEvents } = useLogs();
  const bgColor = useColorModeValue('gray.200', 'gray.900');
  const isDarkmode = colorMode !== 'light';
  const colorModeButtonText = isDarkmode
    ? 'Toggle light mode'
    : 'Toggle dark mode';

  const helpText = useBreakpointValue({
    base: 'Support',
    md: 'Support & feedback',
  });

  const showLogsButton = useBreakpointValue({ base: false, lg: true });
  const navigate = useNavigate();

  const now = new Date();
  const lastMessageShouldBeVisible =
    loggedEvents[0] &&
    now.getTime() - loggedEvents[0].timestamp.getTime() < 10000
      ? true
      : false;

  return (
    <Center width="100%" position="fixed" bottom="0" pointerEvents="none">
      <Stack width="100%" spacing="0">
        <MainActionBar />
        <Grid
          backgroundColor={bgColor}
          width="100%"
          templateColumns="2fr 3fr 2fr"
          pointerEvents="auto"
        >
          <HStack p="1">
            <Link as={ReachLink} to="/">
              <Logo height="20px" />
            </Link>
            {showLogsButton ? <InfoButton /> : null}
          </HStack>

          {showLogsButton ? (
            <Button
              variant="link"
              fontWeight="normal"
              onClick={() => navigate('/logs')}
            >
              <Text
                textAlign="center"
                opacity={lastMessageShouldBeVisible ? 100 : 0}
                transition="opacity 0.5s ease"
                fontSize="xs"
              >
                {loggedEvents[0] ? `${loggedEvents[0].msg}` : null}
              </Text>
            </Button>
          ) : (
            <InfoButton />
          )}
          <HStack justifyContent="flex-end" paddingX="2">
            <Center></Center>
            <Link as={ReachLink} to="/feedback">
              <Text fontSize="xs">{helpText}</Text>
            </Link>
            <Center>
              <Tooltip label={colorModeButtonText}>
                <Link>
                  <Icon
                    as={isDarkmode ? SunFill : MoonFill}
                    aria-label={colorModeButtonText}
                    onClick={() => setColorMode(isDarkmode ? 'light' : 'dark')}
                  />
                </Link>
              </Tooltip>
            </Center>
            <Tooltip label="Visit the workspace on Slack">
              <Link href={slackInvite} p="0">
                <Icon as={Slack} p="0" />
              </Link>
            </Tooltip>
            <Tooltip label="Visit the repository on GitHub">
              <Link href={githubRepo}>
                <Icon as={Github} />
              </Link>
            </Tooltip>
          </HStack>
        </Grid>
        {!bluetoothIsAvailable ? (
          <Center p="2" backgroundColor="red">
            <Text fontSize="l">
              Bluetooth is not available in this browser yet. Check{' '}
              <Link
                textDecor="underline"
                href="https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth#browser_compatibility"
              >
                the docs for browsers supporting Bluetooth
              </Link>
              .
            </Text>
          </Center>
        ) : null}
      </Stack>
    </Center>
  );
};

const InfoButton = () => {
  const { shouldShowWelcomeMessageHint, onOpen: openWelcomMessage } =
    useWelcomeMessageModal();
  const [showWelcomeMessageTooltip, setShowWelcomeMessageTooltip] =
    useState(false);

  useEffect(() => {
    const showTimeout = setTimeout(() => {
      if (shouldShowWelcomeMessageHint) {
        setShowWelcomeMessageTooltip(true);

        const hideTimeout = setTimeout(
          () => setShowWelcomeMessageTooltip(false),
          seconds(20)
        );

        return () => clearTimeout(hideTimeout);
      }
    }, seconds(3));
    return () => clearTimeout(showTimeout);
  }, []);
  return (
    <Tooltip
      label="New here? Click here for some info!"
      isOpen={showWelcomeMessageTooltip}
    >
      <Button
        variant="link"
        fontWeight="normal"
        onClick={() => {
          setShowWelcomeMessageTooltip(false);
          openWelcomMessage();
        }}
      >
        <Text>What's dundring.com?</Text>
      </Button>
    </Tooltip>
  );
};
