import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { useOptionsModal } from '../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import { Center, Stack } from '@chakra-ui/layout';
import * as React from 'react';
import { useReadWriteOptions } from '../../context/OptionsContext';
import { Checkbox } from '@chakra-ui/checkbox';
import { Tooltip } from '@chakra-ui/tooltip';

export const OptionsModal = () => {
  const { isOpen } = useOptionsModal();
  const navigate = useNavigate();

  const options = useReadWriteOptions();

  return (
    <Modal isOpen={isOpen} onClose={() => navigate('/')}>
      <ModalOverlay />
      <ModalContent p="5">
        <ModalHeader>Options</ModalHeader>
        <ModalCloseButton />
        <Center>
          <Stack>
            <OptionsCheckbox
              option={options.showIntervalTimer}
              tooltip={
                'Check to have the remaing time of an interval displayed'
              }
              text={'Show remaining time for interval'}
            />
            <OptionsCheckbox
              option={options.showTotalDurationTimer}
              tooltip={
                'Check to have the total duration of a session displayed'
              }
              text={'Show total duration timer'}
            />
            <OptionsCheckbox
              option={options.showSpeed}
              tooltip={'Check to have the current speed displayed'}
              text={'Show current speed'}
            />
            <OptionsCheckbox
              option={options.showDistance}
              tooltip={'Check to have the distance displayed'}
              text={'Show distance'}
            />
            <OptionsCheckbox
              option={options.showHeartRateCurrent}
              tooltip={'Check to have current heart rate displayed'}
              text={'Show current heart rate'}
            />
            <OptionsCheckbox
              option={options.showHeartRateMax}
              tooltip={
                'Check to have maximum heart rate reached in this session displayed'
              }
              text={'Show max heart rate reached'}
            />
            <OptionsCheckbox
              option={options.showPowerCurrent}
              tooltip={'Check to have current power displayed'}
              text={'Show current power'}
            />
            <OptionsCheckbox
              option={options.showPowerTarget}
              tooltip={'Check to have current power target displayed'}
              text={'Show current power target'}
            />
          </Stack>
        </Center>
      </ModalContent>
    </Modal>
  );
};

const OptionsCheckbox = (props: {
  option: { value: boolean; set: (b: boolean) => void };
  tooltip: string;
  text: string;
}) => {
  const { option, tooltip, text } = props;
  return (
    // needs shouldWrapChildren to behave correctly on checkboxes
    <Tooltip label={tooltip} shouldWrapChildren>
      <Checkbox
        onChange={(e) => {
          option.set(e.target.checked);
        }}
        isChecked={option.value}
      >
        {text}
      </Checkbox>
    </Tooltip>
  );
};
