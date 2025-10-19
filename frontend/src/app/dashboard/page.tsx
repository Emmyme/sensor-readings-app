"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  LogOut,
} from "lucide-react";
import { sensorsAPI, Sensor, PaginatedResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AllSensorsChart from "@/components/AllSensorsChart";
import { EditSensorForm } from "@/components/EditSensorForm";
import { AddSensorForm } from "@/components/AddSensorForm";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import Link from "next/link";

export default function DashboardPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(6);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sortBy, setSortBy] = useState<string>("name");
  const [filterByModel, setFilterByModel] = useState<string>("all");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sensorToDelete, setSensorToDelete] = useState<Sensor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user, isAuthenticated, logout, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadAvailableModels = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/sensors/models/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const models = await response.json();
        setAvailableModels(models);
      }
    } catch {
      // Silently handle error
    }
  }, [token]);

  const loadSensors = useCallback(async () => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      const response: PaginatedResponse<Sensor> = await sensorsAPI.list(
        currentPage,
        pageSize,
        debouncedSearchTerm || undefined,
        filterByModel === "all" ? undefined : filterByModel,
        sortBy
      );
      setSensors(response.items);
      setTotalCount(response.count);
    } catch {
      setError("Failed to load sensors");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    filterByModel,
    sortBy,
    isInitialLoad,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadSensors();
    loadAvailableModels();
  }, [isAuthenticated, router, loadSensors, loadAvailableModels]);

  const handleDeleteSensor = (sensor: Sensor) => {
    setSensorToDelete(sensor);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sensorToDelete) return;

    setDeleteLoading(true);
    try {
      await sensorsAPI.delete(sensorToDelete.id);
      await loadSensors();
      setDeleteModalOpen(false);
      setSensorToDelete(null);
    } catch {
      setError("Failed to delete sensor");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setEditModalOpen(true);
  };

  const handleSensorUpdated = (updatedSensor: Sensor) => {
    setSensors(
      sensors.map((s) => (s.id === updatedSensor.id ? updatedSensor : s))
    );
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedSensor(null);
  };

  const handleAddSensor = () => {
    setAddModalOpen(true);
  };

  const handleSensorAdded = (newSensor: Sensor) => {
    setSensors([newSensor, ...sensors]);
    setTotalCount(totalCount + 1);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  const resetFilters = () => {
    setFilterByModel("all");
    setSortBy("name");
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sensor Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={handleAddSensor}>
                  <Plus className="w-4 h-4" />
                  Add Sensor
                </Button>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading && isInitialLoad ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sensors.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No sensors
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new sensor.
              </p>
              <div className="mt-6">
                <Button onClick={handleAddSensor}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first sensor
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <AllSensorsChart />

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Sensors
                  </h2>

                  <div className="flex items-center space-x-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search sensors..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={filterByModel}
                      onValueChange={setFilterByModel}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="readings_count">
                          Least Readings
                        </SelectItem>
                        <SelectItem value="-readings_count">
                          Most Readings
                        </SelectItem>
                        <SelectItem value="-last_reading_timestamp">
                          Most Recent Data
                        </SelectItem>
                        <SelectItem value="last_reading_timestamp">
                          Oldest Data
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {(filterByModel !== "all" ||
                      sortBy !== "name" ||
                      searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </Button>
                    )}

                    {searchLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    )}
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                    searchLoading ? "opacity-50" : "opacity-100"
                  }`}
                >
                  {sensors.map((sensor) => (
                    <Card
                      key={sensor.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {sensor.name}
                            </CardTitle>
                            <CardDescription>{sensor.model}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSensor(sensor)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSensor(sensor)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sensor.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {sensor.description}
                          </p>
                        )}
                        <div className="space-y-2 mb-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-1" />
                            {sensor.readings_count} readings
                          </div>
                          <div className="text-xs">
                            Last reading:{" "}
                            {sensor.last_reading_timestamp
                              ? new Date(
                                  sensor.last_reading_timestamp
                                ).toLocaleString()
                              : "No readings yet"}
                          </div>
                        </div>
                        <div className="flex justify-end -mt-10">
                          <Link
                            href={`/sensors/${sensor.id}`}
                            className="text-blue-600 hover:text-blue-400 font-medium text-sm p-1"
                          >
                            View Details →
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalCount > pageSize && (
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(totalCount / pageSize)}(
                      {totalCount} total sensors)
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Sensor</DialogTitle>
            </DialogHeader>
            {selectedSensor && (
              <EditSensorForm
                sensor={selectedSensor}
                onSensorUpdated={handleSensorUpdated}
                onClose={handleCloseEditModal}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Sensor Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Sensor</DialogTitle>
            </DialogHeader>
            <AddSensorForm
              onSensorAdded={handleSensorAdded}
              onClose={handleCloseAddModal}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationDialog
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          title="Delete Sensor"
          description={
            sensorToDelete
              ? `Are you sure you want to delete "${sensorToDelete.name}"? This action cannot be undone and will remove all associated readings.`
              : ""
          }
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      </div>
    </TooltipProvider>
  );
}
