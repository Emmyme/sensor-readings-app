"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readingsAPI, Reading } from "@/lib/api";

interface AddReadingDialogFormProps {
  sensorId: number;
  onReadingAdded: (newReading: Reading) => void;
  onClose: () => void;
}

export function AddReadingDialogForm({
  sensorId,
  onReadingAdded,
  onClose,
}: AddReadingDialogFormProps) {
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set default timestamp to current date/time
  useState(() => {
    const now = new Date();
    const localTimestamp = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    setTimestamp(localTimestamp);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newReading = await readingsAPI.create(sensorId, {
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        timestamp: new Date(timestamp).toISOString(),
      });
      onReadingAdded(newReading);
      onClose();
      // Reset form
      setTemperature("");
      setHumidity("");
      const now = new Date();
      const localTimestamp = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setTimestamp(localTimestamp);
    } catch {
      setError("Failed to add reading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature (°C)</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="Enter temperature"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="humidity">Humidity (%)</Label>
        <Input
          id="humidity"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={humidity}
          onChange={(e) => setHumidity(e.target.value)}
          placeholder="Enter humidity"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timestamp">Date & Time</Label>
        <Input
          id="timestamp"
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Reading"}
        </Button>
      </div>
    </form>
  );
}
