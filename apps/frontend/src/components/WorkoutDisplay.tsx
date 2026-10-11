import { Stack, Text } from '@chakra-ui/react';
import * as React from 'react';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { Workout } from '../types';
import { wattFromFtpPercent } from '../utils/general';
import {
  getTotalWorkoutTime,
  secondsToHoursMinutesAndSecondsString,
} from '@dundring/utils';

export const WorkoutDisplay = () => {
  const { activeWorkout, activeFtp, changeActivePart } = useActiveWorkout();
  if (!activeWorkout.workout) {
    return null;
  }

  const { activePart, status, partElapsedTime, workout } = activeWorkout;

  return (
    <Stack fontSize="sm">
      <Text>{workout.name}</Text>
      <Text>Based on {activeFtp}W FTP</Text>
      <Text>{secondsToHoursMinutesAndSecondsString(partElapsedTime)}</Text>
      {workout.parts.map((part, i) => {
        const isActive = status === 'active' && i === activePart;
        const targetPowerText =
          part.targetPower > 0
            ? `${part.targetPower}% (${wattFromFtpPercent(part.targetPower, activeFtp)}W)`
            : 'Free mode';

        return (
          <Text
            key={i}
            fontWeight={isActive ? 'bold' : 'normal'}
            color={isActive ? 'purple.500' : ''}
            cursor="pointer"
            onClick={() => changeActivePart(i)}
          >
            {`${secondsToHoursMinutesAndSecondsString(part.duration)}@${targetPowerText}`}
          </Text>
        );
      })}
      {status === 'finished' ? (
        <Text>DONE!</Text>
      ) : (
        <Text>{getTimeLeft(workout, partElapsedTime, activePart)}</Text>
      )}
    </Stack>
  );
};

const getTimeLeft = (
  workout: Workout,
  partElapsedTime: number,
  activePart: number
): string => {
  const totalWorkoutTime = getTotalWorkoutTime(workout);

  const timeElapsed =
    partElapsedTime +
    workout.parts.reduce(
      (acc, part, ind) => (ind < activePart ? acc + part.duration : acc),
      0
    );

  return secondsToHoursMinutesAndSecondsString(totalWorkoutTime - timeElapsed);
};
