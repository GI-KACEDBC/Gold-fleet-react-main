import { useState, useCallback, useMemo } from 'react';
import { vehicleMakesModels, getAllMakes, getModelsByMake } from '../data/vehicleMakesModels';

/**
 * Custom Hook: useVehicleMakeModel
 * 
 * Manages Make and Model selection with flexible input (dropdown + custom values)
 * 
 * Features:
 * - Maintains make and model data independently
 * - Supports predefined makes/models from vehicleMakesModels
 * - Allows custom make/model entry when not found in predefined list
 * - Auto-resets model when make changes
 * - Validates against predefined list
 * - Provides custom make/model lists for dynamic filtering
 * 
 * Usage:
 *   const { make, model, setMake, setModel, makeOptions, modelOptions, isCustomMake } = useVehicleMakeModel(initialMake, initialModel);
 */
export const useVehicleMakeModel = (initialMake = '', initialModel = '') => {
  const [make, setMakeState] = useState(initialMake);
  const [model, setModelState] = useState(initialModel);
  const [customMakes, setCustomMakes] = useState([]);
  const [customModels, setCustomModels] = useState([]);

  // Check if current make is a custom value (not in predefined list)
  const isCustomMake = useMemo(() => {
    return make && !vehicleMakesModels.hasOwnProperty(make);
  }, [make]);

  // Check if current model is a custom value
  const isCustomModel = useMemo(() => {
    if (!make) return false;
    const models = getModelsByMake(make);
    return model && !models.includes(model);
  }, [make, model]);

  // Get predefined makes
  const predefinedMakes = useMemo(() => {
    return getAllMakes();
  }, []);

  // Get make options (predefined + custom)
  const makeOptions = useMemo(() => {
    const allMakes = [...predefinedMakes, ...customMakes];
    return [...new Set(allMakes)].sort().map((m) => ({
      value: m,
      label: m,
    }));
  }, [predefinedMakes, customMakes]);

  // Get model options based on selected make
  const modelOptions = useMemo(() => {
    if (!make) return [];

    // Get predefined models for the selected make
    const models = getModelsByMake(make);

    // If it's a custom make, also include custom models added for this make
    const customForThisMake = isCustomMake
      ? customModels.filter((m) => m.make === make).map((m) => m.model)
      : [];

    const allModels = [...models, ...customForThisMake];
    return [...new Set(allModels)].sort().map((m) => ({
      value: m,
      label: m,
    }));
  }, [make, customModels, isCustomMake]);

  // Set make and reset model if make changes
  const setMake = useCallback((newMake) => {
    setMakeState(newMake);
    // Auto-reset model when make changes, unless it's the same make
    if (newMake !== make) {
      setModelState('');
    }
  }, [make]);

  // Set model
  const setModel = useCallback((newModel) => {
    setModelState(newModel);
  }, []);

  // Add custom make
  const addCustomMake = useCallback((newMake) => {
    if (newMake && !customMakes.includes(newMake)) {
      setCustomMakes((prev) => [...new Set([...prev, newMake])]);
    }
  }, [customMakes]);

  // Add custom model
  const addCustomModel = useCallback(
    (newModel) => {
      if (newModel && make) {
        const entry = { make, model: newModel };
        const isDuplicate = customModels.some(
          (m) => m.make === make && m.model === newModel
        );
        if (!isDuplicate) {
          setCustomModels((prev) => [...prev, entry]);
        }
      }
    },
    [make, customModels]
  );

  return {
    make,
    model,
    setMake,
    setModel,
    makeOptions,
    modelOptions,
    isCustomMake,
    isCustomModel,
    addCustomMake,
    addCustomModel,
    predefinedMakes,
  };
};

export default useVehicleMakeModel;
