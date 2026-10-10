import * as React from 'react';
import { useUser } from '../../context/UserContext';
import { useWebsocket } from '../../context/WebsocketContext';
import {
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useParams } from 'react-router';
import { illegalCharactersInUsername } from '@dundring/utils';

export const CreateOrJoinGroupSession = () => {
  const { groupId: groupIdParam } = useParams();
  const [hasTriedToConnect, setHasTriedToConnect] = React.useState(false);
  const {
    activeGroupSession,
    startGroupSession,
    joinGroupSession,
    joinStatus,
    createStatus,
  } = useWebsocket();

  const { user } = useUser();
  const [groupSessionId, setGroupSessionId] = React.useState('');
  const [guestUsername, setGuestUsername] = React.useState('');

  const username = user.loggedIn ? user.username : guestUsername;
  const usernameAvailable = user.loggedIn || guestUsername ? true : false;
  const illegalCharacters = illegalCharactersInUsername(username);
  const maxUsernameLength = 20;
  const usernameContainsIllegalCharacters = illegalCharacters.length > 0;
  const usernameIsTooLong = guestUsername.length > maxUsernameLength;
  const usernameIsValid =
    !usernameIsTooLong && !usernameContainsIllegalCharacters;

  React.useEffect(() => {
    if (!groupIdParam || activeGroupSession) return;
    setGroupSessionId(groupIdParam);
    if (user.loggedIn && !hasTriedToConnect) {
      joinGroupSession(groupIdParam, user.username);
      setHasTriedToConnect(true);
    }
  }, [
    activeGroupSession,
    groupIdParam,
    user,
    joinGroupSession,
    hasTriedToConnect,
    setHasTriedToConnect,
  ]);

  return (
    <Stack p="5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (usernameAvailable && usernameIsValid) {
            startGroupSession(username);
          }
        }}
      >
        {!user.loggedIn ? (
          <FormControl isInvalid={!usernameIsValid}>
            <FormLabel>Enter guest username</FormLabel>
            <Input
              placeholder="Guest username"
              type="guest-username"
              name="guest-username"
              value={guestUsername}
              onChange={(e) => {
                setGuestUsername(e.target.value.replace(' ', ''));
              }}
              onBlur={(_e) => {
                setGuestUsername((guestUsername) => guestUsername.trim());
              }}
            />
            <FormErrorMessage>
              The username can't
              {usernameIsTooLong
                ? ` be more than ${maxUsernameLength} characters long`
                : ''}
              {usernameIsTooLong && usernameContainsIllegalCharacters
                ? ' or'
                : ''}
              {usernameContainsIllegalCharacters
                ? ` contain ${illegalCharacters.join(',')}`
                : ''}
              .
            </FormErrorMessage>
          </FormControl>
        ) : null}

        <FormControl isInvalid={createStatus === 'ERROR'}>
          <Button
            type="submit"
            isDisabled={!usernameAvailable || !usernameIsValid}
            isLoading={createStatus === 'LOADING'}
          >
            Start group session
          </Button>
          <FormErrorMessage>Something went wrong.</FormErrorMessage>
        </FormControl>
      </form>
      <Divider />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (groupSessionId && usernameAvailable && usernameIsValid) {
            joinGroupSession(groupSessionId, username);
          }
        }}
      >
        <FormControl>
          <FormLabel>Join group session</FormLabel>
          <Input
            placeholder="Group session id"
            type="group-session-id"
            name="group-session-id"
            value={groupSessionId}
            onChange={(e) => {
              setGroupSessionId(e.target.value);
            }}
            onBlur={(_e) => {
              setGroupSessionId((groupSessionId) => groupSessionId.trim());
            }}
          />
        </FormControl>
        <FormControl
          isInvalid={!(joinStatus === 'NOT_ASKED' || joinStatus === 'LOADING')}
        >
          <Button
            type="submit"
            disabled={!groupSessionId || !usernameAvailable || !usernameIsValid}
            isLoading={joinStatus === 'LOADING'}
          >
            Join group session
          </Button>
          <FormErrorMessage>
            {joinStatus === 'ROOM_NOT_FOUND'
              ? 'Room not found.'
              : 'Something went wrong.'}
          </FormErrorMessage>
        </FormControl>
      </form>
    </Stack>
  );
};
