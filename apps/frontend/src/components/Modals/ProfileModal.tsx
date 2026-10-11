import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightAddon,
  Link,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
  useToast,
} from '@chakra-ui/react';
import * as React from 'react';
import { useUser } from '../../context/UserContext';
import frontendUtils from '../../utils';
import * as utils from '@dundring/utils';
import * as api from '../../api';
import { useProfileModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import { LoggedInUser } from '../../types';
import { addEditableError, editable, touched } from '../../utils/general';
import {
  BoxArrowUpRight,
  CheckCircleFill,
  Circle,
} from 'react-bootstrap-icons';
import { getStravaAuthorizeUrl } from '../ConnectWithStravaButton';

export const ProfileModal = () => {
  const { isOpen } = useProfileModal();
  const { user } = useUser();
  const navigate = useNavigate();

  const onClose = () => {
    navigate('/');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      {user.loggedIn ? (
        <ProfileModalContent user={user} onClose={onClose} />
      ) : null}
    </Modal>
  );
};

interface Props {
  user: LoggedInUser;
  onClose: () => void;
}
export const ProfileModalContent = ({ user, onClose }: Props) => {
  const settingUpProfile = utils.settingUpProfile(user);

  const [ftpInput, setFtpInput] = React.useState(
    editable(settingUpProfile ? '' : `${user.ftp}`)
  );

  const [usernameInput, setUsernameInput] = React.useState(
    editable(settingUpProfile ? '' : user.username)
  );
  const { setUser } = useUser();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const toast = useToast();

  const updateProfile = async (input: { username: string; ftp: string }) => {
    if (isLoading) {
      return;
    }

    const response = await api.updateUser(user.token, {
      ftp: parseInt(input.ftp.trim()),
      username: input.username,
    });
    setIsLoading(false);

    if (response.status === 'FAILURE') {
      if (response.message === 'Username is already taken') {
        setUsernameInput((usernameInput) =>
          addEditableError(usernameInput, 'Username is already taken')
        );
      } else {
        setErrorMessage(response.message);
      }
    } else if (response.status === 'SUCCESS') {
      const { ftp, username, accessToken } = response.data;
      setUser({ ...user, ftp, username, token: accessToken });

      toast({
        title: settingUpProfile ? 'Profile set up!' : 'Data updated!',
        description: settingUpProfile ? 'Welcome to dundring.com!' : undefined,
        isClosable: true,
        duration: 5000,
        status: 'success',
      });
      onClose();
    }
  };

  const username = usernameInput.data;
  const usernameIsTouched = usernameInput.touched;

  const usernameIsTooLong = utils.usernameIsTooLong(username);
  const illegalCharacters = utils.illegalCharactersInUsername(username);
  const usernameContainsIllegalCharacters = illegalCharacters.length > 0;

  const ftp = parseInt(ftpInput.data);
  const ftpIsValid =
    ftp &&
    ftp >= 0 &&
    frontendUtils.general.stringIsValidUnsignedInt(ftpInput.data);

  const inputMaxWidth = '350px';

  return (
    <ModalContent>
      <ModalHeader>
        {settingUpProfile ? 'Set up profile' : 'Edit profile'}
      </ModalHeader>
      <ModalCloseButton />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({
            username: usernameInput.data,
            ftp: ftpInput.data,
          });
        }}
      >
        <ModalBody>
          <Stack>
            <Stack gap="5">
              <FormControl
                isInvalid={
                  (!utils.usernameIsValid(username) && usernameIsTouched) ||
                  !!usernameInput.error
                }
              >
                <FormLabel>
                  {settingUpProfile ? 'Chooose a username' : 'Username'}
                </FormLabel>
                <Input
                  placeholder="E.g. mrdundring"
                  name="username"
                  autoComplete={'off'}
                  value={usernameInput.data}
                  maxW={inputMaxWidth}
                  onChange={(e) => {
                    setUsernameInput(touched(e.target.value.replace(' ', '')));
                  }}
                  onBlur={(_e) => {
                    setUsernameInput((value) =>
                      touched(value.data.trim().toLowerCase())
                    );
                  }}
                />
                {/* TODO: Add "and on leaderboards" when leaderboards are implemented */}
                <FormErrorMessage>
                  {usernameInput.error
                    ? usernameInput.error
                    : `The username can't ${
                        usernameIsTooLong
                          ? ` be more than ${utils.maxUsernameLength} characters long`
                          : ''
                      } ${
                        usernameIsTooLong && usernameContainsIllegalCharacters
                          ? ' or'
                          : ''
                      } ${
                        usernameContainsIllegalCharacters
                          ? ` contain ${illegalCharacters.join(',')}`
                          : ''
                      }.`}
                </FormErrorMessage>

                <FormHelperText>
                  Your username is displayed to others in group sessions. Your
                  username can be changed at any time.
                </FormHelperText>
              </FormControl>
              <FormControl isInvalid={!ftpIsValid && ftpInput.touched}>
                <FormLabel>
                  {settingUpProfile ? 'What is your FTP?' : 'Your FTP'}
                </FormLabel>
                <InputGroup maxW={inputMaxWidth}>
                  <Input
                    placeholder="E.g. 250"
                    type="ftp"
                    name="ftp"
                    value={ftpInput.data}
                    onChange={(e) => {
                      setFtpInput(touched(e.target.value.replace(' ', '')));
                    }}
                    onBlur={(_e) => {
                      setFtpInput((value) => touched(value.data.trim()));
                    }}
                  />
                  <InputRightAddon children="Watt" />
                </InputGroup>
                <FormErrorMessage>
                  The FTP needs to be a positive whole number
                </FormErrorMessage>
                <FormHelperText>
                  Your FTP, or Functional Threshold Power, is the maximum Watt
                  can maintain for an hour. The workouts on dundring.com are
                  based on FTP, meaning you can create a workout suiting your
                  FTP and share it with a friend, and it will be adjusted to
                  their FTP.
                </FormHelperText>
              </FormControl>

              <FormControl isInvalid={errorMessage !== ''}>
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
              </FormControl>
              {user.stravaData ? (
                <Stack>
                  <Text fontWeight="medium">Strava</Text>
                  <Link
                    href={`https://strava.com/athletes/${user.stravaData.athleteId}`}
                    fontSize="sm"
                    alignItems="center"
                    isExternal
                    display="flex"
                    gap="5px"
                  >
                    View connected Strava profile
                    <BoxArrowUpRight />
                  </Link>
                  <Text>Granted permissions</Text>
                  <List>
                    <ListItem>
                      <ListIcon as={scopeIcon(user.stravaData.scopes.read)} />
                      Read basic profile data
                    </ListItem>
                    <ListItem>
                      <ListIcon
                        as={scopeIcon(user.stravaData.scopes.activityWrite)}
                      />
                      Post activities
                    </ListItem>
                  </List>
                  <HStack>
                    <Link
                      href={getStravaAuthorizeUrl({ forcePrompt: true })}
                      fontSize="sm"
                      isExternal
                      display="flex"
                      alignItems="center"
                      gap="5px"
                    >
                      Update permissions <BoxArrowUpRight />
                    </Link>
                  </HStack>
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </ModalBody>
        <ModalFooter justifyContent="space-between" gap="3">
          {!settingUpProfile ? (
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={() => {
                toast({
                  title: `Signed out of ${user.username}`,
                  isClosable: true,
                  duration: 5000,
                  status: 'success',
                });
                setUser({ loggedIn: false });
                onClose();
              }}
            >
              Sign out
            </Button>
          ) : null}
          <Button
            type="submit"
            isDisabled={
              isLoading ||
              !utils.usernameIsValid(username) ||
              !ftpIsValid ||
              !!usernameInput.error
            }
          >
            {settingUpProfile ? 'Complete profile!' : 'Save'}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  );
};

const scopeIcon = (enabled: boolean) => (enabled ? CheckCircleFill : Circle);
