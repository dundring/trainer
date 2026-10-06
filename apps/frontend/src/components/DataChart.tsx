import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomGraphTooltip } from './Graph/CustomGraphTooltip';
import { hrColors, powerColors, untrackedColor } from '../colors';
import { ShowData } from './Graph/GraphContainer';
import React from 'react';
import { secondsToHoursMinutesAndSecondsString } from '@dundring/utils';

const fillAreaChart = (
  dataPrefix: string,
  checked: ShowData,
  index: number,
  showFill: boolean,
  type: 'hr' | 'power',
  isUntracked: boolean = false
) => {
  const hrColor = isUntracked
    ? untrackedColor
    : hrColors[index % hrColors.length];
  const powerColor = isUntracked
    ? untrackedColor
    : powerColors[index % powerColors.length];
  const hrGradientId = dataPrefix + 'colorHR';
  const powerGradientId = dataPrefix + 'colorPower';
  const showHr = type === 'hr' && checked.hr;
  const showPower = type === 'power' && checked.power;

  return (
    <React.Fragment key={`${dataPrefix}-${type}`}>
      {showFill ? (
        <defs>
          {showHr ? (
            <linearGradient id={`${hrGradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={hrColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={hrColor} stopOpacity={0} />
            </linearGradient>
          ) : null}
          {showPower ? (
            <linearGradient
              id={`${powerGradientId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={powerColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={powerColor} stopOpacity={0} />
            </linearGradient>
          ) : null}
        </defs>
      ) : null}

      {showHr ? (
        <Area
          dataKey={`${dataPrefix} HR`}
          stroke={hrColor}
          fill={`url(#${hrGradientId})`}
          animationDuration={0}
          width={20}
          yAxisId={'hrYAxis'}
        />
      ) : null}
      {showPower ? (
        <Area
          dataKey={`${dataPrefix} Power`}
          stroke={powerColor}
          fill={`url(#${powerGradientId})`}
          animationDuration={0}
          width={20}
          yAxisId={'powerYAxis'}
        />
      ) : null}
    </React.Fragment>
  );
};

export type DataPoint<T extends string = string> = Record<
  `${T} ${'HR' | 'Power'}`,
  number | undefined
>;

interface Props {
  allMerged: DataPoint[];
  otherUsers: string[];
  showOtherUsersData: { [username: string]: ShowData };
  showUserData: ShowData;
  showFill: boolean;
}

export const DataChart = ({
  allMerged,
  otherUsers,
  showOtherUsersData,
  showUserData,
  showFill,
}: Props) => {
  return (
    <ResponsiveContainer width="100%" style={{ display: 'block' }}>
      <AreaChart data={allMerged}>
        {otherUsers.map((username, i) =>
          fillAreaChart(
            username,
            showOtherUsersData[username] || {
              hr: true,
              power: true,
            },
            i + 1,
            showFill,
            'power'
          )
        )}
        {fillAreaChart(
          'You-Untracked',
          showUserData,
          0,
          showFill,
          'power',
          true
        )}
        {fillAreaChart('You', showUserData, 0, showFill, 'power')}
        {otherUsers.map((username, i) =>
          fillAreaChart(
            username,
            showOtherUsersData[username] || {
              hr: true,
              power: true,
            },
            i + 1,
            showFill,
            'hr'
          )
        )}
        {fillAreaChart('You', showUserData, 0, showFill, 'hr')}
        {fillAreaChart('You-Untracked', showUserData, 0, showFill, 'hr', true)}

        <YAxis
          yAxisId="powerYAxis"
          orientation="left"
          label={{ value: 'Power', angle: -90, position: 'insideLeft' }}
          stroke={powerColors[0]}
        />

        <YAxis
          yAxisId="hrYAxis"
          orientation="right"
          domain={['dataMin - 20', 'dataMax+20']}
          stroke={hrColors[0]}
          label={{ value: 'HR', angle: -90, position: 'insideRight' }}
        />
        <XAxis
          interval={0}
          tickFormatter={(value: any) => {
            return '-' + secondsToHoursMinutesAndSecondsString(500 - value);
          }}
          ticks={[140, 260, 380]} /* ticks to get -2 min, -4min, -6min */
        />
        <Tooltip content={<CustomGraphTooltip />} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
