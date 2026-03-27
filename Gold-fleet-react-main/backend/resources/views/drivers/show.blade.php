@extends('layouts.app')

@section('title', 'Driver Details')

@section('content')
<div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Driver Details</h1>
            <p class="text-gray-600">Detailed information about the driver</p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('drivers.edit', $driver) }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                Edit Driver
            </a>
            <form action="{{ route('drivers.destroy', $driver) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this driver?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                    Delete Driver
                </button>
            </form>
            <a href="{{ route('drivers.index') }}" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                Back to Drivers
            </a>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Driver Image -->
            <div class="md:col-span-1">
                <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    @if($driver->image_url)
                        <img src="{{ $driver->image_url }}" alt="Driver Photo" class="w-full h-full object-cover">
                    @else
                        <div class="w-full h-full flex items-center justify-center">
                            <svg class="h-24 w-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Driver Details -->
            <div class="md:col-span-2 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Full Name</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->user->name }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->phone }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->user->email }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">License Number</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->license_number }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">License Expiry Date</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->license_expiry->format('M d, Y') }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Assigned Vehicle</label>
                        <p class="mt-1 text-sm text-gray-900">
                            @if($driver->vehicle)
                                {{ $driver->vehicle->year }} {{ $driver->vehicle->make }} {{ $driver->vehicle->model }} ({{ $driver->vehicle->license_plate }})
                            @else
                                No vehicle assigned
                            @endif
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Driver Status</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            @if($driver->status === 'active') bg-green-100 text-green-800
                            @elseif($driver->status === 'suspended') bg-red-100 text-red-800
                            @else bg-gray-100 text-gray-800 @endif">
                            {{ ucfirst($driver->status) }}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Date Joined</label>
                        <p class="mt-1 text-sm text-gray-900">{{ $driver->created_at->format('M d, Y') }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection