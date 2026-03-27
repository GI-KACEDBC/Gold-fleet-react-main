@extends('layouts.app')

@section('title', 'Edit Vehicle')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
            <p class="text-gray-600">Update vehicle information</p>
        </div>
        <a href="{{ route('vehicles.index') }}" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
            Back to Vehicles
        </a>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action="{{ route('vehicles.update', $vehicle) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Vehicle Image -->
                <div class="md:col-span-2">
                    <label for="image" class="block text-sm font-medium text-gray-700">Vehicle Image</label>
                    @if($vehicle->image_url)
                        <div class="mt-1 mb-4">
                            <img src="{{ $vehicle->image_url }}" alt="Current Image" class="h-32 w-32 object-cover rounded-lg border">
                        </div>
                    @endif
                    <div class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div class="space-y-1 text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            <div class="flex text-sm text-gray-600">
                                <label for="image" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Replace image</span>
                                    <input id="image" name="image" type="file" class="sr-only" accept="image/*">
                                </label>
                                <p class="pl-1">or drag and drop</p>
                            </div>
                            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                        </div>
                    </div>
                    @error('image')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Vehicle Name -->
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Vehicle Name</label>
                    <input type="text" name="name" id="name" value="{{ old('name', $vehicle->name) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    @error('name')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- License Plate -->
                <div>
                    <label for="license_plate" class="block text-sm font-medium text-gray-700">Plate Number <span class="text-red-500">*</span></label>
                    <input type="text" name="license_plate" id="license_plate" value="{{ old('license_plate', $vehicle->license_plate) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                    @error('license_plate')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Vehicle Type -->
                <div>
                    <label for="type" class="block text-sm font-medium text-gray-700">Vehicle Type <span class="text-red-500">*</span></label>
                    <select name="type" id="type" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                        <option value="">Select Type</option>
                        <option value="Car" {{ old('type', $vehicle->type) == 'Car' ? 'selected' : '' }}>Car</option>
                        <option value="Bus" {{ old('type', $vehicle->type) == 'Bus' ? 'selected' : '' }}>Bus</option>
                        <option value="Truck" {{ old('type', $vehicle->type) == 'Truck' ? 'selected' : '' }}>Truck</option>
                        <option value="Van" {{ old('type', $vehicle->type) == 'Van' ? 'selected' : '' }}>Van</option>
                    </select>
                    @error('type')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Brand -->
                <div>
                    <label for="make" class="block text-sm font-medium text-gray-700">Brand <span class="text-red-500">*</span></label>
                    <input type="text" name="make" id="make" value="{{ old('make', $vehicle->make) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                    @error('make')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Model -->
                <div>
                    <label for="model" class="block text-sm font-medium text-gray-700">Model <span class="text-red-500">*</span></label>
                    <input type="text" name="model" id="model" value="{{ old('model', $vehicle->model) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                    @error('model')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Manufacturing Year -->
                <div>
                    <label for="year" class="block text-sm font-medium text-gray-700">Manufacturing Year <span class="text-red-500">*</span></label>
                    <input type="number" name="year" id="year" value="{{ old('year', $vehicle->year) }}" min="1900" max="{{ date('Y') + 1 }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                    @error('year')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Status -->
                <div>
                    <label for="status" class="block text-sm font-medium text-gray-700">Status <span class="text-red-500">*</span></label>
                    <select name="status" id="status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                        <option value="">Select Status</option>
                        <option value="active" {{ old('status', $vehicle->status) == 'active' ? 'selected' : '' }}>Active</option>
                        <option value="inactive" {{ old('status', $vehicle->status) == 'inactive' ? 'selected' : '' }}>Inactive</option>
                        <option value="maintenance" {{ old('status', $vehicle->status) == 'maintenance' ? 'selected' : '' }}>Maintenance</option>
                    </select>
                    @error('status')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                {{-- Assigned driver removed; Vehicles page is vehicle-only --}}

                <!-- Fuel Type -->
                <div>
                    <label for="fuel_type" class="block text-sm font-medium text-gray-700">Fuel Type <span class="text-red-500">*</span></label>
                    <select name="fuel_type" id="fuel_type" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                        <option value="">Select Fuel Type</option>
                        <option value="diesel" {{ old('fuel_type', $vehicle->fuel_type) == 'diesel' ? 'selected' : '' }}>Diesel</option>
                        <option value="gasoline" {{ old('fuel_type', $vehicle->fuel_type) == 'gasoline' ? 'selected' : '' }}>Gasoline</option>
                        <option value="electric" {{ old('fuel_type', $vehicle->fuel_type) == 'electric' ? 'selected' : '' }}>Electric</option>
                        <option value="hybrid" {{ old('fuel_type', $vehicle->fuel_type) == 'hybrid' ? 'selected' : '' }}>Hybrid</option>
                    </select>
                    @error('fuel_type')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Fuel Capacity -->
                <div>
                    <label for="fuel_capacity" class="block text-sm font-medium text-gray-700">Fuel Capacity (Liters)</label>
                    <input type="number" name="fuel_capacity" id="fuel_capacity" value="{{ old('fuel_capacity', $vehicle->fuel_capacity) }}" step="0.01" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    @error('fuel_capacity')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- VIN -->
                <div>
                    <label for="vin" class="block text-sm font-medium text-gray-700">VIN <span class="text-red-500">*</span></label>
                    <input type="text" name="vin" id="vin" value="{{ old('vin', $vehicle->vin) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required>
                    @error('vin')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Notes -->
                <div class="md:col-span-2">
                    <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" id="notes" rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">{{ old('notes', $vehicle->notes) }}</textarea>
                    @error('notes')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                    Update Vehicle
                </button>
            </div>
        </form>
    </div>
</div>
@endsection