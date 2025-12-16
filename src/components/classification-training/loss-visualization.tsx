"use client";

import { useMemo } from "react";
import { Card } from "@/components/shadcn-ui/card";
import { Badge } from "@/components/shadcn-ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
  perTestAccuracy?: Record<string, number>;
}

interface LossVisualizationProps {
  metrics: TrainingMetrics[];
}

export function LossVisualization({ metrics }: LossVisualizationProps) {
  // console.log("Rendering LossVisualization with metrics:", metrics);
  const allTestNames = Array.from(
    new Set(metrics.flatMap((m) => Object.keys(m.perTestAccuracy || {})))
  );

  // build chartData with explicit keys for every test
  const chartData = metrics.map((metric) => {
    const base: Record<string, number> = {
      epoch: metric.epoch,
      "Training Loss": metric.loss,
      "Validation Loss": metric.valLoss,
      "Training Accuracy": metric.accuracy * 100,
      "Aphasia Type": metric.valAccuracy * 100,
    };
    allTestNames.forEach((test) => {
      base[`${test}`] = (metric.perTestAccuracy?.[test] ?? 0) * 100;
    });
    // console.log("Chart data point:", base);
    return base;
  });

  const latestMetrics = useMemo(() => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  }, [metrics]);

  const bestMetrics = useMemo(() => {
    if (metrics.length === 0) return null;

    const bestValAccuracy = Math.max(...metrics.map((m) => m.valAccuracy));
    const bestValLoss = Math.min(...metrics.map((m) => m.valLoss));
    const bestTrainAccuracy = Math.max(...metrics.map((m) => m.accuracy));
    const bestTrainLoss = Math.min(...metrics.map((m) => m.loss));

    return {
      bestValAccuracy,
      bestValLoss,
      bestTrainAccuracy,
      bestTrainLoss,
    };
  }, [metrics]);

  const trends = useMemo(() => {
    if (metrics.length < 5) return null;

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    if (older.length === 0) return null;

    const recentAvgLoss =
      recent.reduce((sum, m) => sum + m.loss, 0) / recent.length;
    const olderAvgLoss =
      older.reduce((sum, m) => sum + m.loss, 0) / older.length;
    const recentAvgAcc =
      recent.reduce((sum, m) => sum + m.accuracy, 0) / recent.length;
    const olderAvgAcc =
      older.reduce((sum, m) => sum + m.accuracy, 0) / older.length;

    return {
      lossImproving: recentAvgLoss < olderAvgLoss,
      accuracyImproving: recentAvgAcc > olderAvgAcc,
      lossChange: ((recentAvgLoss - olderAvgLoss) / olderAvgLoss) * 100,
      accuracyChange: ((recentAvgAcc - olderAvgAcc) / olderAvgAcc) * 100,
    };
  }, [metrics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{`Epoch ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toFixed(4)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (metrics.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Training Metrics
        </h3>
        <p className="text-muted-foreground">
          Training metrics will appear here once training begins.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Loss</p>
              <p className="text-2xl font-bold">
                {latestMetrics?.loss.toFixed(4)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {trends?.lossImproving ? (
                <TrendingDown className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-400" />
              )}
              {trends && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trends.lossImproving ? "text-green-400" : "text-red-400"
                  )}
                >
                  {Math.abs(trends.lossChange).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Best: {bestMetrics?.bestTrainLoss.toFixed(4)}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Accuracy</p>
              <p className="text-2xl font-bold">
                {((latestMetrics?.accuracy || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-1">
              {trends?.accuracyImproving ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              {trends && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trends.accuracyImproving ? "text-green-400" : "text-red-400"
                  )}
                >
                  {Math.abs(trends.accuracyChange).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Best: {((bestMetrics?.bestTrainAccuracy || 0) * 100).toFixed(1)}%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Val Loss</p>
              <p className="text-2xl font-bold">
                {latestMetrics?.valLoss.toFixed(4)}
              </p>
            </div>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Best: {bestMetrics?.bestValLoss.toFixed(4)}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Val Accuracy</p>
              <p className="text-2xl font-bold">
                {((latestMetrics?.valAccuracy || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Best: {((bestMetrics?.bestValAccuracy || 0) * 100).toFixed(1)}%
            </Badge>
          </div>
        </Card>
      </div>

      {/* Loss Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Training & Validation Loss</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Epochs: {metrics.length}
            </Badge>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="epoch"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={["dataMin", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Training Loss"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-1)", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Validation Loss"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-3)", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Accuracy Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Accuracy on Validation set</h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="epoch"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* <Area
                type="monotone"
                dataKey="Training Accuracy"
                stackId="1"
                stroke="hsl(var(--chart-5))"
                fill="var(--chart-5)"
                fillOpacity={0.7}
              /> */}
              {allTestNames.map((test, i) => (
                <Line
                  key={test}
                  type="monotone"
                  dataKey={`${test}`}
                  // stackId={`test-${i}`}
                  stroke={`var(--chart-${(i % 6) + 1})`}
                  fill={`var(--chart-${(i % 6) + 1})`}
                  fillOpacity={0.7}
                />
              ))}

              <Line
                key={"overall"}
                type="monotone"
                dataKey="Aphasia Type"
                // stackId="2"
                stroke="var(--chart-5)"
                fill="var(--chart-5)"
                fillOpacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Training Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Training Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Best Training Loss:
                </span>
                <span className="font-mono">
                  {bestMetrics?.bestTrainLoss.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Best Validation Loss:
                </span>
                <span className="font-mono">
                  {bestMetrics?.bestValLoss.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Best Training Accuracy:
                </span>
                <span className="font-mono">
                  {((bestMetrics?.bestTrainAccuracy || 0) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Best Validation Accuracy:
                </span>
                <span className="font-mono">
                  {((bestMetrics?.bestValAccuracy || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Training Progress</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Epochs:</span>
                <span className="font-mono">{metrics.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overfitting Risk:</span>
                <Badge
                  variant={
                    latestMetrics &&
                    latestMetrics.loss < latestMetrics.valLoss * 0.8
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {latestMetrics &&
                  latestMetrics.loss < latestMetrics.valLoss * 0.8
                    ? "High"
                    : "Low"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Convergence:</span>
                <Badge
                  variant={trends?.lossImproving ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {trends?.lossImproving ? "Improving" : "Stable"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
