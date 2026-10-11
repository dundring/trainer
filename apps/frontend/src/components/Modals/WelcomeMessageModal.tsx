import {
  Button,
  Heading,
  Image,
  Link,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import { useWelcomeMessageModal } from '../../context/ModalContext';
import { useLinkPowerColor } from '../../hooks/useLinkColor';
import { githubRepo, slackInvite } from '../../links';

export const WelcomeMessageModal = () => {
  const { isOpen, onClose } = useWelcomeMessageModal();
  const linkColor = useLinkPowerColor();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to dundring.com!</ModalHeader>
        <Stack p="5">
          <Text>
            <Link color={linkColor} href="https://dundring.com">
              dundring.com
            </Link>{' '}
            is a free and open source in-browser training application created to
            control and track your training with a Bluetooth smart bike trainer.
          </Text>
          <Image
            src="/gifs/preview.gif"
            alt="Preview of dundring.com being used"
          />
          <Heading as="h2" size="md" pt="5">
            Main features
          </Heading>
          <UnorderedList pl="5">
            <ListItem>
              <Text as="b">ERG mode training</Text> – controlling the resistance
              of your smart trainer.
            </ListItem>
            <ListItem>
              <Text as="b">Workout editor</Text> – create and share workouts
              using the workout editor.
            </ListItem>
            <ListItem>
              <Text as="b">Group sessions</Text> – train with a group of people
              and see eachother's workout data live.
            </ListItem>
            <ListItem>
              <Text as="b">Export data as TCX</Text> – workout data can be
              exported as a TCX file and uploaded to your favorite training
              tracker, such as Strava.
            </ListItem>
          </UnorderedList>
          <Heading as="h2" size="md" pt="5">
            Controlling the power
          </Heading>
          <Text>
            Dundring can control your smart trainer's resistance, giving you the
            option to set the resistance as you go, or to create a workout
            program, which will set the resistance at given intervals.
          </Text>
          <Heading as="h3" size="sm" pt="2">
            Controlling the resistance manually
          </Heading>
          <Text>
            You can control the resistance as you go by using the power
            controls.
          </Text>
          <Image
            src="/gifs/set_resistance_manually.gif"
            alt="Preview of resistance being set manually"
          />
          <Heading as="h3" size="sm" pt="2">
            Controlling the resistance manually
          </Heading>
          <Text>
            You can let your predefined workout set the resistance for you.
          </Text>
          <Image
            src="/gifs/set_resistance_workout.gif"
            alt="Preview of a workout setting the resistance"
          />

          <Heading as="h2" size="md" pt="5">
            Create workouts
          </Heading>
          <Text>
            You can create workouts and store these locally or in the cloud.
            Workouts stored in the cloud can be shared.
          </Text>
          <Image
            src="/gifs/edit_workout.gif"
            alt="Preview of a workout being edited"
          />

          <Heading as="h2" size="md" pt="5">
            Group sessions
          </Heading>
          <Text>
            You can create a group sessions to workout with your friends!
          </Text>
          <Image
            src="/gifs/group_session.gif"
            alt="Preview of a group sessions"
          />

          <Heading as="h2" size="md" pt="5">
            Tell us what you think!
          </Heading>
          <Text>
            <Link color={linkColor} href="https://dundring.com">
              dundring.com
            </Link>{' '}
            is a hobby project created to have a nice and easy way to get some
            training done. We'll continue to improve the project with features
            as we go, and we love feedback, feature suggestions and questions,
            so feel free to reach out to us in our{' '}
            <Link color={linkColor} href={slackInvite}>
              Slack workspace
            </Link>
            !
          </Text>
          <Heading as="h3" size="sm" pt="2">
            Want to contribute to the project?
          </Heading>
          <Text>
            The source code can be found at{' '}
            <Link color={linkColor} href={githubRepo}>
              GitHub
            </Link>
          </Text>
          <Button onClick={onClose}>Okay!</Button>
          <ModalCloseButton />
        </Stack>
      </ModalContent>
    </Modal>
  );
};
