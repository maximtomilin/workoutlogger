import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export type ChartPoint = { time: number; value: number };

type Props = {
  points: ChartPoint[]; // oldest first
  height?: number;
};

const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const TICKS = 4;

const formatDate = (time: number) =>
  new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function ProgressChart({ points, height = 220 }: Props) {
  const [width, setWidth] = useState(0);

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Give the line some breathing room, and never go below zero
  const pad = max === min ? 5 : (max - min) * 0.15;
  const lo = Math.max(0, min - pad);
  const hi = max + pad;

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  const t0 = points[0].time;
  const t1 = points[points.length - 1].time;

  const x = (time: number) =>
    t1 === t0 ? PAD_LEFT + innerW / 2 : PAD_LEFT + ((time - t0) / (t1 - t0)) * innerW;
  const y = (value: number) => PAD_TOP + (1 - (value - lo) / (hi - lo)) * innerH;

  const ticks = Array.from({ length: TICKS }, (_, i) => lo + (i * (hi - lo)) / (TICKS - 1));
  const line = points.map((p) => `${x(p.time)},${y(p.value)}`).join(' ');

  return (
    <View style={{ width: '100%' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((tick) => (
            <Line
              key={`grid-${tick}`}
              x1={PAD_LEFT}
              x2={width - PAD_RIGHT}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e5e5e5"
              strokeWidth={1}
            />
          ))}
          {ticks.map((tick) => (
            <SvgText
              key={`label-${tick}`}
              x={PAD_LEFT - 8}
              y={y(tick) + 4}
              fontSize={11}
              fill="#888"
              textAnchor="end"
            >
              {Number(tick.toFixed(1))}
            </SvgText>
          ))}

          {points.length > 1 && (
            <Polyline points={line} fill="none" stroke="#111" strokeWidth={2.5} />
          )}
          {points.map((p) => (
            <Circle
              key={p.time}
              cx={x(p.time)}
              cy={y(p.value)}
              r={4.5}
              fill="#111"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}

          {t1 === t0 ? (
            <SvgText
              x={x(t0)}
              y={height - 8}
              fontSize={11}
              fill="#888"
              textAnchor="middle"
            >
              {formatDate(t0)}
            </SvgText>
          ) : (
            <>
              <SvgText x={PAD_LEFT} y={height - 8} fontSize={11} fill="#888" textAnchor="start">
                {formatDate(t0)}
              </SvgText>
              <SvgText
                x={width - PAD_RIGHT}
                y={height - 8}
                fontSize={11}
                fill="#888"
                textAnchor="end"
              >
                {formatDate(t1)}
              </SvgText>
            </>
          )}
        </Svg>
      )}
    </View>
  );
}