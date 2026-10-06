import {
  ResponsiveContainer,
  BarChart,
  YAxis,
  Tooltip,
  Bar,
  XAxis,
} from 'recharts';
import { CustomChartTooltip } from './Graph/CustomChartTooltip';
import { powerColors } from '../colors';
import React from 'react';

interface Props {
  otherPeoplesAvgPower: ({
    [x: string]: string | number;
    name: string;
  } | null)[];
  myAvgPower: number;
  otherUsers: string[];
  showFill: boolean;
}

export const PowerBar = ({
  otherPeoplesAvgPower,
  otherUsers,
  showFill,
  myAvgPower,
}: Props) => {
  const fillBarChart = (dataPrefix: string, show: boolean, index: number) => {
    const powerColor = powerColors[index % powerColors.length];
    const powerGradientId = dataPrefix + 'colorPower';
    return (
      <React.Fragment key={index}>
        {showFill ? (
          <defs>
            <linearGradient
              id={`${powerGradientId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={powerColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={powerColor} stopOpacity={0} />
            </linearGradient>
          </defs>
        ) : null}

        {show ? (
          <Bar
            dataKey={`${dataPrefix} Power`}
            stroke={powerColor}
            fill={`url(#${powerGradientId})`}
            width={20}
          />
        ) : null}
      </React.Fragment>
    );
  };

  return (
    <ResponsiveContainer style={{ display: 'block' }}>
      <BarChart
        data={[
          [
            { name: 'You Power', 'You Power': myAvgPower },
            ...otherPeoplesAvgPower,
          ].reduce((res, cur) => ({ ...res, ...cur }), {}),
        ]}
      >
        {fillBarChart('You', true, 0)}
        {otherUsers.map((username, i) => fillBarChart(username, true, i + 1))}
        <YAxis />
        <XAxis tick={false} />
        <Tooltip content={<CustomChartTooltip />} cursor={false} />
      </BarChart>
    </ResponsiveContainer>
  );
};
