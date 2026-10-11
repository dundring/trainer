import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import * as React from 'react';
import * as api from '../../api';
import { useFeedbackModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import * as utils from '@dundring/utils';
import { editable } from '../../utils/general';
import { Editable } from '../../types';
import { useLinkPowerColor } from '../../hooks/useLinkColor';

interface State {
  mail: Editable<string>;
  message: Editable<string>;
  response:
    | { type: 'not_asked' }
    | { type: 'loading' }
    | { type: 'error'; message: string }
    | { type: 'success' };
}

export const FeedbackModal = () => {
  const { isOpen } = useFeedbackModal();
  const navigate = useNavigate();

  const toast = useToast();

  const onClose = React.useCallback(() => {
    navigate('/');
  }, [navigate]);

  const [state, setState] = React.useState<State>({
    mail: editable(''),
    message: editable(''),
    response: { type: 'not_asked' },
  });

  const linkColor = useLinkPowerColor();

  const mail = state.mail.data;
  const mailIsTouched = state.mail.touched;
  const mailIsValid = utils.mailIsValid(mail);

  const feedback = state.message.data;
  const feedbackIsValid = state.message.data.trim() !== '';

  const sendFeedback = async () => {
    const trimmedMail = state.mail.data.trim();

    setState((state) => ({ ...state, response: { type: 'loading' } }));
    const response = await api.sendFeedback({
      message: feedback.trim(),
      mail: trimmedMail ?? null,
    });

    if (response.status === 'FAILURE') {
      setState((state) => ({ ...state, errorMessage: response.message }));
    } else if (response.status === 'SUCCESS') {
      setState((state) => ({ ...state, response: { type: 'success' } }));

      toast({
        title: 'Thank you for your feedback!',
        description: mail
          ? "We'll get back to you as soon as possible!"
          : undefined,
        isClosable: true,
        duration: 10000,
        status: 'success',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        {
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendFeedback();
            }}
          >
            <ModalHeader>Support and feedback</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing="10">
                <FormControl isRequired>
                  <FormLabel>Question or feedback</FormLabel>
                  <Textarea
                    placeholder="Ask us anything or tell us what you think!"
                    name="feedback"
                    id="feedback"
                    value={state.message.data}
                    onChange={(e) => {
                      setState((state) => ({
                        ...state,
                        message: editable(e.target.value),
                      }));
                    }}
                  />
                </FormControl>

                <FormControl isInvalid={!mailIsValid && mailIsTouched}>
                  <FormLabel optionalIndicator>Mail</FormLabel>
                  <Input
                    placeholder="Mail"
                    type="email"
                    name="email"
                    autoComplete="email"
                    id="email"
                    value={mail}
                    onChange={(e) => {
                      setState((state) => ({
                        ...state,
                        mail: editable(e.target.value),
                      }));
                    }}
                  />
                  <FormHelperText>
                    We'll need some way of contacting you if you want an answer
                    to your question or feedback, but it's not required.
                  </FormHelperText>
                </FormControl>
                <Text>
                  You can also head over to the{' '}
                  <Link
                    color={linkColor}
                    href="https://join.slack.com/t/dundring/shared_invite/zt-10g7cx905-6ugYR~UdMEFBAkwdSWOAew"
                  >
                    dundring.com Slack workspace
                  </Link>{' '}
                  for discussions and support!
                </Text>

                {state.response.type === 'error' ? (
                  <Text color="red.500">{state.response.message}</Text>
                ) : null}
                <Flex alignSelf="end">
                  {state.response.type !== 'loading' ? (
                    <Button isDisabled={!feedbackIsValid} type="submit">
                      Send feedback
                    </Button>
                  ) : (
                    <Spinner />
                  )}
                </Flex>
              </Stack>
            </ModalBody>
          </form>
        }
      </ModalContent>
    </Modal>
  );
};
