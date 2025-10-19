"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar, RefreshCw } from "lucide-react";
import { sensorsAPI, readingsAPI, Sensor, Reading } from "@/lib/api";

interface ChartData {
  timestamp: string;
  formattedTime: string;
  [key: string]: string | number; // Dynamic sensor data
}

interface SensorData {
  sensor: Sensor;
  readings: Reading[];
}

interface AllSensorsChartProps {
  className?: string;
}

const COLORS = [
  "#ef4444", 
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#a855f7", 
];

const getColorForModel = (model: string): string => {
  let hash = 0;
  for (let i = 0; i < model.length; i++) {
    hash = model.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

export default function AllSensorsChart({ className }: AllSensorsChartProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metricType, setMetricType] = useState<"temperature" | "humidity">(
    "temperature"
  );
  const [fromDate, setFromDate] = useState<string>("2024-08-01");
  const [toDate, setToDate] = useState<string>("2024-08-02");

  const loadSensorData = useCallback(async () => {
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);

      const from = new Date(fromDate);
      const to = new Date(toDate);
      const daySpan = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

      if (daySpan <= 1) {
        return date.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (daySpan <= 7) {
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (daySpan <= 90) {
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        return date.toLocaleString("en-US", {
          year: "2-digit",
          month: "short",
        });
      }
    };

    const getTimeRangeFilter = () => {
      const from = new Date(fromDate);
      return from.toISOString();
    };

    const getToDateFilter = () => {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of day
      return to.toISOString();
    };

    try {
      setLoading(true);
      setError("");

      const sensorsResponse = await sensorsAPI.list(
        1,
        50, 
        undefined, 
        undefined, 
        "name" 
      );
      const sensorsList = sensorsResponse.items;
      setSensors(sensorsList);

      if (sensorsList.length === 0) {
        setChartData([]);
        return;
      }

      // Get readings for each sensor
      const timestampFrom = getTimeRangeFilter();
      const timestampTo = getToDateFilter();
      const sensorDataPromises = sensorsList.map(
        async (sensor): Promise<SensorData> => {
          try {
            const readingsResponse = await readingsAPI.list(
              sensor.id,
              1,
              100, 
              timestampFrom,
              timestampTo
            );
            return {
              sensor,
              readings: readingsResponse.items,
            };
          } catch {
            return {
              sensor,
              readings: [],
            };
          }
        }
      );

      const allSensorData = await Promise.all(sensorDataPromises);

      const allReadings: Array<
        Reading & { sensorName: string; sensorId: number }
      > = [];

      allSensorData.forEach(({ sensor, readings }) => {
        readings.forEach((reading) => {
          allReadings.push({
            ...reading,
            sensorName: sensor.name,
            sensorId: sensor.id,
          });
        });
      });

      allReadings.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const groupedData = new Map<string, ChartData>();

      const getGroupingInterval = () => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const daySpan = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

        if (daySpan <= 1) {
          return { type: "minutes", interval: 5 }; 
        } else if (daySpan <= 7) {
          return { type: "minutes", interval: 60 }; 
        } else if (daySpan <= 30) {
          return { type: "hours", interval: 6 }; 
        } else if (daySpan <= 90) {
          return { type: "days", interval: 1 }; 
        } else if (daySpan <= 365) {
          return { type: "days", interval: 7 }; 
        } else {
          return { type: "days", interval: 30 }; 
        }
      };

      const groupingConfig = getGroupingInterval();

      allReadings.forEach((reading) => {
        const date = new Date(reading.timestamp);
        let timeKey: string;

        if (groupingConfig.type === "minutes") {
          const roundedMinutes =
            Math.floor(date.getMinutes() / groupingConfig.interval) *
            groupingConfig.interval;
          date.setMinutes(roundedMinutes, 0, 0);
          timeKey = date.toISOString();
        } else if (groupingConfig.type === "hours") {
          const roundedHours =
            Math.floor(date.getHours() / groupingConfig.interval) *
            groupingConfig.interval;
          date.setHours(roundedHours, 0, 0, 0);
          timeKey = date.toISOString();
        } else if (groupingConfig.type === "days") {
          const daysSinceEpoch = Math.floor(
            date.getTime() / (1000 * 60 * 60 * 24)
          );
          const roundedDays =
            Math.floor(daysSinceEpoch / groupingConfig.interval) *
            groupingConfig.interval;
          const groupedDate = new Date(roundedDays * 24 * 60 * 60 * 1000);
          groupedDate.setHours(0, 0, 0, 0);
          timeKey = groupedDate.toISOString();
        } else {
          timeKey = date.toISOString();
        }

        if (!groupedData.has(timeKey)) {
          groupedData.set(timeKey, {
            timestamp: timeKey,
            formattedTime: formatTimestamp(timeKey),
          });
        }

        const dataPoint = groupedData.get(timeKey)!;
        const sensorKey = `${reading.sensorName}_${metricType}`;

        if (dataPoint[sensorKey] !== undefined) {
          dataPoint[sensorKey] =
            ((dataPoint[sensorKey] as number) + reading[metricType]) / 2;
        } else {
          dataPoint[sensorKey] = reading[metricType];
        }
      });

      const from = new Date(fromDate);
      const to = new Date(toDate);
      const daySpan = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);

      let maxDataPoints = 50;
      if (daySpan <= 1) {
        maxDataPoints = 50; 
      } else if (daySpan <= 7) {
        maxDataPoints = 24 * Math.ceil(daySpan); 
      } else if (daySpan <= 30) {
        maxDataPoints = 4 * Math.ceil(daySpan); 
      } else if (daySpan <= 90) {
        maxDataPoints = Math.ceil(daySpan); 
      } else if (daySpan <= 365) {
        maxDataPoints = Math.ceil(daySpan / 7); 
      } else {
        maxDataPoints = Math.ceil(daySpan / 30); 
      }

      const finalChartData = Array.from(groupedData.values())
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .slice(-maxDataPoints);

      setChartData(finalChartData);
    } catch {
      setError("Failed to load sensor data");
    } finally {
      setLoading(false);
    }
  }, [metricType, fromDate, toDate]);

  useEffect(() => {
    loadSensorData();
  }, [loadSensorData]);

  const getSensorLines = () => {
    if (chartData.length === 0) return [];

    const sensorKeys = new Set<string>();
    chartData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (
          key.endsWith(`_${metricType}`) &&
          key !== "timestamp" &&
          key !== "formattedTime"
        ) {
          sensorKeys.add(key);
        }
      });
    });

    return Array.from(sensorKeys).map((key) => {
      const sensorName = key.replace(`_${metricType}`, "");
      const sensor = sensors.find((s) => s.name === sensorName);
      const model = sensor?.model || sensorName;

      return {
        key,
        name: `${sensorName} (${model})`, 
        color: getColorForModel(model),
      };
    });
  };

  const sensorLines = getSensorLines();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Sensors Overview
            </CardTitle>
            <CardDescription>
              {metricType === "temperature" ? "Temperature" : "Humidity"}{" "}
              readings from all sensors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={metricType}
              onValueChange={(value: "temperature" | "humidity") =>
                setMetricType(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Label htmlFor="from-date" className="text-sm">
                From:
              </Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36"
              />
              <Label htmlFor="to-date" className="text-sm">
                To:
              </Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSensorData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-center text-red-600 py-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : sensors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No sensors found. Add some sensors to see their data here.
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No readings found for the selected time range.
            </p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value:
                      metricType === "temperature"
                        ? "Temperature (°C)"
                        : "Humidity (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}${
                      metricType === "temperature" ? "°C" : "%"
                    }`,
                    name,
                  ]}
                />
                <Legend />
                {sensorLines.map(({ key, name, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    name={name}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && sensors.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing data from {sensors.length} sensor
            {sensors.length !== 1 ? "s" : ""}
            {chartData.length > 0 && ` with ${chartData.length} data points`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
