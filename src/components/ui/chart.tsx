import React from 'react';

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <div className="chart-container">{children}</div>;
};

export const ChartContainer = Chart;
export const ChartTooltip = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ChartTooltipContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
