"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sensorsAPI, Sensor } from "@/lib/api";

interface EditSensorFormProps {
  sensor: Sensor;
  onSensorUpdated: (updatedSensor: Sensor) => void;
  onClose: () => void;
}

export function EditSensorForm({
  sensor,
  onSensorUpdated,
  onClose,
}: EditSensorFormProps) {
  const [name, setName] = useState(sensor.name);
  const [model, setModel] = useState(sensor.model);
  const [description, setDescription] = useState(sensor.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updatedSensor = await sensorsAPI.update(sensor.id, {
        name,
        model,
        description,
      });
      onSensorUpdated(updatedSensor);
      onClose();
    } catch {
      setError("Failed to update sensor");
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
        <Label htmlFor="name">Sensor Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
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
          {loading ? "Updating..." : "Update Sensor"}
        </Button>
      </div>
    </form>
  );
}
