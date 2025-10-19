"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sensorsAPI, Sensor } from "@/lib/api";

interface AddSensorFormProps {
  onSensorAdded: (newSensor: Sensor) => void;
  onClose: () => void;
}

export function AddSensorForm({ onSensorAdded, onClose }: AddSensorFormProps) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newSensor = await sensorsAPI.create({
        name,
        model,
        description,
      });
      onSensorAdded(newSensor);
      onClose();
      // Reset form
      setName("");
      setModel("");
      setDescription("");
    } catch {
      setError("Failed to create sensor");
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
          placeholder="Enter sensor name"
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
          placeholder="Enter sensor model"
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
          {loading ? "Creating..." : "Create Sensor"}
        </Button>
      </div>
    </form>
  );
}
