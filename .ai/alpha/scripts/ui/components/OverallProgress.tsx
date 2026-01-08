import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar } from './ProgressBar.js';
import type { OverallProgressProps } from '../types.js';

/**
 * Overall progress component showing spec-level completion
 *
 * Displays three progress bars:
 * - Initiatives (magenta)
 * - Features (cyan)
 * - Tasks (green)
 */
export const OverallProgress: React.FC<OverallProgressProps> = ({ progress }) => {
  // Calculate overall percentage
  const overallPercent =
    progress.tasksTotal > 0
      ? Math.round((progress.tasksCompleted / progress.tasksTotal) * 100)
      : 0;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={2}
      marginY={1}
    >
      <Box justifyContent="space-between">
        <Text bold>Overall Progress</Text>
        <Text color={overallPercent === 100 ? 'green' : 'cyan'} bold>
          {overallPercent}%
        </Text>
      </Box>

      {/* Initiatives row */}
      {progress.initiativesTotal > 0 && (
        <Box marginTop={1}>
          <Box width={12}>
            <Text color="magenta">Initiatives:</Text>
          </Box>
          <ProgressBar
            current={progress.initiativesCompleted}
            total={progress.initiativesTotal}
            width={25}
            filledColor="magenta"
            showPercentage={false}
          />
        </Box>
      )}

      {/* Features row */}
      <Box marginTop={progress.initiativesTotal > 0 ? 0 : 1}>
        <Box width={12}>
          <Text color="cyan">Features:</Text>
        </Box>
        <ProgressBar
          current={progress.featuresCompleted}
          total={progress.featuresTotal}
          width={25}
          filledColor="cyan"
          showPercentage={false}
        />
      </Box>

      {/* Tasks row */}
      <Box>
        <Box width={12}>
          <Text color="green">Tasks:</Text>
        </Box>
        <ProgressBar
          current={progress.tasksCompleted}
          total={progress.tasksTotal}
          width={25}
          filledColor="green"
          showPercentage={false}
        />
      </Box>
    </Box>
  );
};

/**
 * Compact overall progress for tight spaces
 */
export const CompactOverallProgress: React.FC<OverallProgressProps> = ({
  progress,
}) => {
  return (
    <Box paddingX={1}>
      <Text dimColor>Progress: </Text>
      <Text color="cyan">
        {progress.featuresCompleted}/{progress.featuresTotal} features
      </Text>
      <Text dimColor> | </Text>
      <Text color="green">
        {progress.tasksCompleted}/{progress.tasksTotal} tasks
      </Text>
    </Box>
  );
};

/**
 * Progress summary as single line
 */
export const ProgressSummaryLine: React.FC<OverallProgressProps> = ({
  progress,
}) => {
  const percent =
    progress.tasksTotal > 0
      ? Math.round((progress.tasksCompleted / progress.tasksTotal) * 100)
      : 0;

  return (
    <Text>
      <Text dimColor>[</Text>
      <Text color="cyan">{progress.featuresCompleted}</Text>
      <Text dimColor>/</Text>
      <Text>{progress.featuresTotal}</Text>
      <Text dimColor> features, </Text>
      <Text color="green">{progress.tasksCompleted}</Text>
      <Text dimColor>/</Text>
      <Text>{progress.tasksTotal}</Text>
      <Text dimColor> tasks</Text>
      <Text dimColor>] </Text>
      <Text color={percent === 100 ? 'green' : 'yellow'} bold>
        {percent}%
      </Text>
    </Text>
  );
};
