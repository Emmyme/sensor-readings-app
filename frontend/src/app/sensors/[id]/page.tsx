"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  ThermometerSun,
  Droplets,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { sensorsAPI, readingsAPI, Sensor, Reading } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AddReadingDialogForm } from "@/components/AddReadingDialogForm";
import { EditSensorForm } from "@/components/EditSensorForm";
import Link from "next/link";

interface ChartData {
  timestamp: string;
  temperature: number;
  humidity: number;
  formattedTime: string;
}

export default function SensorDetailPage() {
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState<string>("2024-08-01");
  const [toDate, setToDate] = useState<string>("2024-08-02");
  const [addReadingModalOpen, setAddReadingModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();

  const sensorId = parseInt(params.id as string);

  const formatTimestamp = (
    timestamp: string,
    fromDate: string,
    toDate: string
  ) => {
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

  const loadSensorData = useCallback(async () => {
    const getTimeRangeFilter = () => {
      const from = new Date(fromDate);
      return from.toISOString();
    };

    const getToDateFilter = () => {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      return to.toISOString();
    };

    try {
      setLoading(true);
      setError("");

      const timestampFrom = getTimeRangeFilter();
      const timestampTo = getToDateFilter();

      const [sensorData, readingsData] = await Promise.all([
        sensorsAPI.get(sensorId),
        readingsAPI.list(sensorId, 1, 200, timestampFrom, timestampTo),
      ]);

      setSensor(sensorData);
      setReadings(readingsData.items);

      const transformedData: ChartData[] = readingsData.items.map(
        (reading) => ({
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          humidity: reading.humidity,
          formattedTime: formatTimestamp(reading.timestamp, fromDate, toDate),
        })
      );

      setChartData(transformedData);
    } catch {
      setError("Failed to load sensor data");
    } finally {
      setLoading(false);
    }
  }, [sensorId, fromDate, toDate]);

  const handleAddReading = () => {
    setAddReadingModalOpen(true);
  };

  const handleEditSensor = () => {
    setEditModalOpen(true);
  };

  const handleSensorUpdated = (updatedSensor: Sensor) => {
    setSensor(updatedSensor);
    setEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleReadingAdded = (newReading: Reading) => {
    setReadings([newReading, ...readings]);
    loadSensorData();
  };

  const handleCloseAddReadingModal = () => {
    setAddReadingModalOpen(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (sensorId) {
      loadSensorData();
    }
  }, [isAuthenticated, sensorId, router, loadSensorData]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !sensor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900">
                Sensor Details
              </h1>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600">{error || "Sensor not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  const latestReading = readings[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sensor.name}
              </h1>
              <p className="text-sm text-gray-600">{sensor.model}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleAddReading} className="w-auto">
                <Plus className="w-4 h-4" />
                Add Reading
              </Button>
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
              <Button variant="outline" onClick={handleEditSensor}>
                Edit Sensor
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sensor Information
              <Badge variant="secondary">
                {sensor.readings_count} readings
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{sensor.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{sensor.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Readings
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {sensor.readings_count}
                </dd>
              </div>
              {sensor.description && (
                <div className="sm:col-span-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {sensor.description}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {latestReading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Latest Temperature
                </CardTitle>
                <ThermometerSun className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestReading.temperature.toFixed(1)}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(latestReading.timestamp, fromDate, toDate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Latest Humidity
                </CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestReading.humidity.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(latestReading.timestamp, fromDate, toDate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Last Updated
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(latestReading.timestamp).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(latestReading.timestamp).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {chartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Readings Chart</CardTitle>
              <CardDescription>
                Temperature vs Humidity from {fromDate} to {toDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    data={chartData}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="humidity"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Humidity (%)",
                        position: "bottom",
                        offset: -5,
                        style: { textAnchor: "middle" },
                      }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      dataKey="temperature"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Temperature (°C)",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                      domain={["dataMin - 2", "dataMax + 2"]}
                    />
                    <Tooltip
                      labelFormatter={() => ""}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}${
                          name === "temperature" ? "°C" : "%"
                        }`,
                        name === "temperature" ? "Temperature" : "Humidity",
                      ]}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="text-sm">{`Time: ${data.formattedTime}`}</p>
                              <p className="text-sm">{`Temperature: ${data.temperature.toFixed(
                                1
                              )}°C`}</p>
                              <p className="text-sm">{`Humidity: ${data.humidity.toFixed(
                                1
                              )}%`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      dataKey="temperature"
                      fill="#ef4444"
                      name="Temperature vs Humidity"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No readings available
                </h3>
                <p className="text-gray-500 mb-4">
                  This sensor doesn&apos;t have any readings yet.
                </p>
                <p className="text-sm text-gray-400">
                  Readings will appear here once data is collected from this
                  sensor.
                </p>
              </div>
              <Button onClick={handleAddReading} className="w-auto mt-4">
                <Plus className="w-4 h-4" />
                Add Reading
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={addReadingModalOpen} onOpenChange={setAddReadingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Reading</DialogTitle>
          </DialogHeader>
          <AddReadingDialogForm
            sensorId={sensorId}
            onReadingAdded={handleReadingAdded}
            onClose={handleCloseAddReadingModal}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Sensor</DialogTitle>
          </DialogHeader>
          <EditSensorForm
            sensor={sensor}
            onSensorUpdated={handleSensorUpdated}
            onClose={handleCloseEditModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
