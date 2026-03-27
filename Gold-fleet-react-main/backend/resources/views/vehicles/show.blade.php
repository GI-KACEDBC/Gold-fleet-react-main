@extends('layouts.app')

@section('title', 'Vehicle Details')

@section('content')
<div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Vehicle Details</h1>
            <p class="text-gray-600">Detailed information about the vehicle</p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('vehicles.edit', $vehicle) }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                Edit Vehicle
            </a>
            <form action="{{ route('vehicles.destroy', $vehicle) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this vehicle?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                    Delete Vehicle
                </button>
            </form>
            <a href="{{ route('vehicles.index') }}" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                Back to Vehicles
            </a>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Vehicle Image -->
            <div class="md:col-span-1">
                <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    @if($vehicle->image_url)
                        <img src="{{ $vehicle->image_url }}" alt="Vehicle Image" class="w-full h-full object-cover">
                    @else
                        <div class="w-full h-full flex items-center justify-center">
                            <svg class="h-24 w-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
                            </svg>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Vehicle Details -->
            <div class="md:col-span-2 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Vehicle Name</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $vehicle->year }} {{ $vehicle->make }} {{ $vehicle->model }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Plate Number</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $vehicle->license_plate }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Vehicle Type</label>
                        <p class="mt-1 text-sm text-gray-900">{{ ucfirst($vehicle->fuel_type) }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Brand & Model</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $vehicle->make }} {{ $vehicle->model }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Year</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $vehicle->year }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            @if($vehicle->status === 'active') bg-green-100 text-green-800
                            @elseif($vehicle->status === 'inactive') bg-gray-100 text-gray-800
                            @elseif($vehicle->status === 'maintenance') bg-yellow-100 text-yellow-800
                            @else bg-red-100 text-red-800 @endif">
                            {{ ucfirst($vehicle->status) }}
                        </span>
                    </div>
                    {{-- Assigned driver removed; Vehicles page is vehicle-only --}}
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Created Date</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $vehicle->created_at->format('M d, Y') }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection