"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function RatioSlider({
  items,
  initialRatios,
  onChange,
  displayKey = "name",
  valueKey = "value",
  allowRemove = true,
  allowAdd = false,
  onRemove,
  onAdd,
  newItemPlaceholder = "Add new item",
  className = "",
  dataType = "string",
  validateNewItem = null,
  selectableOptions = null, // New prop for dropdown options
  searchPlaceholder = "Search options...",
}) {
  // Initialize with equal distribution if no initialRatios provided
  const [percentages, setPercentages] = useState(() => {
    if (initialRatios && initialRatios.length === items.length) {
      return initialRatios.map((r) => r * 100);
    }
    const equalValue = items.length > 0 ? 100 / items.length : 0;
    return Array(items.length).fill(equalValue);
  });

  // Track the previous 100% slider index to handle the bug
  const [prevMaxIndex, setPrevMaxIndex] = useState(null);

  // State for new item input
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemError, setNewItemError] = useState("");

  // State for dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Update percentages when initialRatios change
  useEffect(() => {
    if (initialRatios && initialRatios.length === items.length) {
      setPercentages(initialRatios.map((r) => r * 100));
    }
  }, [initialRatios, items.length]);

  // Handle slider value change
  const handleSliderChange = (index, values) => {
    const newValue = values[0];
    const oldValue = percentages[index];

    // Create a copy of current percentages
    let newPercentages = [...percentages];

    // Check if we're coming from a 100% value
    const isComingFromMax = oldValue === 100;

    // Set the new value for the changed slider
    newPercentages[index] = newValue;

    // Special handling for the 100% case
    if (isComingFromMax && newValue < 100) {
      // When coming down from 100%, distribute the difference equally
      const diff = 100 - newValue;
      const otherIndices = Array.from(
        { length: newPercentages.length },
        (_, i) => i,
      ).filter((i) => i !== index);
      const valuePerItem = diff / otherIndices.length;

      otherIndices.forEach((i) => {
        newPercentages[i] = valuePerItem;
      });

      setPrevMaxIndex(null);
    } else if (newValue === 100) {
      // If setting to 100%, set all others to 0
      newPercentages = newPercentages.map((_, i) => (i === index ? 100 : 0));
      setPrevMaxIndex(index);
    } else {
      // Normal case: redistribute proportionally
      const otherIndices = Array.from(
        { length: newPercentages.length },
        (_, i) => i,
      ).filter((i) => i !== index);

      // Calculate the total of other values before change
      const otherTotal = otherIndices.reduce(
        (sum, i) => sum + percentages[i],
        0,
      );

      // Calculate what's left for other items (100 - this item's new value)
      const remainingPercentage = 100 - newValue;

      // If there are other items and their total isn't 0
      if (otherIndices.length > 0 && otherTotal > 0) {
        // Redistribute the remaining percentage proportionally among other items
        otherIndices.forEach((i) => {
          const proportion = percentages[i] / otherTotal;
          newPercentages[i] = remainingPercentage * proportion;
        });
      } else if (otherIndices.length > 0) {
        // If other total is 0, distribute equally
        const equalValue = remainingPercentage / otherIndices.length;
        otherIndices.forEach((i) => {
          newPercentages[i] = equalValue;
        });
      }
    }

    // Round to 1 decimal place and ensure sum is exactly 100
    newPercentages = normalizePercentages(newPercentages);

    // Update state
    setPercentages(newPercentages);

    // Convert to ratios (0-1) and call onChange
    const ratios = newPercentages.map((p) => p / 100);
    onChange(ratios, newPercentages);
  };

  // Normalize percentages to ensure they sum to exactly 100 and round to 1 decimal
  const normalizePercentages = (percentages) => {
    // Round to 1 decimal
    const rounded = percentages.map((p) => Math.round(p * 10) / 10);

    // Calculate the sum
    const sum = rounded.reduce((a, b) => a + b, 0);

    // If sum is not 100, adjust the largest value
    if (Math.abs(sum - 100) > 0.01) {
      const diff = 100 - sum;
      const largestIndex = rounded.indexOf(Math.max(...rounded));
      rounded[largestIndex] += diff;

      // Ensure no negative values
      return rounded.map((p) => Math.max(0, p));
    }

    return rounded;
  };

  // Handle item removal
  const handleRemove = (index) => {
    // Ensure at least one item remains
    if (items.length <= 1) {
      return;
    }

    // Get the percentage of the item being removed
    const removedPercentage = percentages[index];

    // Create new percentages array without the removed item
    const newPercentages = percentages.filter((_, i) => i !== index);

    // Redistribute the removed percentage proportionally
    const totalRemaining = newPercentages.reduce((sum, p) => sum + p, 0);

    if (totalRemaining > 0) {
      // Proportional redistribution
      for (let i = 0; i < newPercentages.length; i++) {
        newPercentages[i] =
          newPercentages[i] +
          (newPercentages[i] / totalRemaining) * removedPercentage;
      }
    } else {
      // If all remaining are 0, distribute equally
      const equalValue = 100 / newPercentages.length;
      for (let i = 0; i < newPercentages.length; i++) {
        newPercentages[i] = equalValue;
      }
    }

    // Normalize to ensure sum is 100
    const normalizedPercentages = normalizePercentages(newPercentages);

    // Update state
    setPercentages(normalizedPercentages);

    // Convert to ratios and call onChange
    const ratios = normalizedPercentages.map((p) => p / 100);

    // Call the onRemove callback
    if (onRemove) {
      onRemove(index, ratios, normalizedPercentages);
    }
  };

  // Convert value to the specified data type
  const convertToDataType = (value) => {
    switch (dataType.toLowerCase()) {
      case "number":
        return Number(value);
      case "boolean":
        return value.toLowerCase() === "true";
      case "date":
        return new Date(value);
      case "array":
        try {
          return JSON.parse(value);
        } catch (e) {
          return [value];
        }
      case "object":
        try {
          return JSON.parse(value);
        } catch (e) {
          return { value };
        }
      default:
        return value; // string or any other type
    }
  };

  // Handle adding a new item from input
  const handleAddItem = () => {
    if (!newItemValue.trim()) {
      setNewItemError("Please enter a value");
      return;
    }

    // Validate new item if validator provided
    if (validateNewItem) {
      const validationResult = validateNewItem(newItemValue);
      if (validationResult !== true) {
        setNewItemError(validationResult);
        return;
      }
    }

    // Clear any previous errors
    setNewItemError("");

    // Convert to the specified data type
    const typedValue = convertToDataType(newItemValue);

    // Add the item with proper percentage distribution
    addItemWithDistribution(typedValue);

    // Clear the input
    setNewItemValue("");
  };

  // Handle selecting an item from dropdown
  const handleSelectItem = (option) => {
    // Get the value from the option
    const value = typeof option === "object" ? option[valueKey] : option;

    // Check if the item already exists
    const itemExists = items.some((item) => {
      if (typeof item === "object" && item !== null) {
        return item[valueKey] === value;
      }
      return item === value;
    });

    if (itemExists) {
      setNewItemError("This item already exists");
      return;
    }

    // Clear any previous errors
    setNewItemError("");

    // Add the item with proper percentage distribution
    addItemWithDistribution(option);

    // Close the dropdown
    setDropdownOpen(false);
    setSearchValue("");
  };

  // Common function to add item and distribute percentages
  const addItemWithDistribution = (newItem) => {
    // Calculate new percentages
    const newItemCount = items.length + 1;
    const newPercentages = [...percentages];

    // Take a small percentage from each existing item for the new item
    const newItemPercentage = 100 / newItemCount; // Equal distribution approach

    // Adjust all percentages for equal distribution
    for (let i = 0; i < newPercentages.length; i++) {
      newPercentages[i] = (100 - newItemPercentage) * (newPercentages[i] / 100);
    }

    // Add the new item's percentage
    newPercentages.push(newItemPercentage);

    // Normalize to ensure sum is 100
    const normalizedPercentages = normalizePercentages(newPercentages);

    // Update state
    setPercentages(normalizedPercentages);

    // Convert to ratios and call onChange
    const ratios = normalizedPercentages.map((p) => p / 100);

    // Call the onAdd callback
    if (onAdd) {
      onAdd(newItem, ratios, normalizedPercentages);
    }
  };

  // Get display name for an item
  const getItemDisplay = (item, index) => {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      return String(item);
    }
    return item[displayKey] || `Item ${index + 1}`;
  };

  // Get helper text based on data type
  const getDataTypeHelper = () => {
    switch (dataType.toLowerCase()) {
      case "number":
        return "Please enter a number";
      case "boolean":
        return "Please enter 'true' or 'false'";
      case "date":
        return "Please enter a valid date";
      case "array":
        return "Please enter a JSON array or comma-separated values";
      case "object":
        return "Please enter a JSON object";
      default:
        return "";
    }
  };

  // Filter options for the dropdown
  const getFilteredOptions = () => {
    if (!selectableOptions) return [];

    return selectableOptions.filter((option) => {
      const optionValue =
        typeof option === "object" ? option[displayKey] : String(option);
      return optionValue.toLowerCase().includes(searchValue.toLowerCase());
    });
  };

  // Check if an option is already selected
  const isOptionSelected = (option) => {
    const optionValue = typeof option === "object" ? option[valueKey] : option;

    return items.some((item) => {
      if (typeof item === "object" && item !== null) {
        return item[valueKey] === optionValue;
      }
      return item === optionValue;
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={
              typeof item === "object" && item !== null
                ? item.id || index
                : `${item}-${index}`
            }
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="py-1 px-3 bg-slate-800 border border-slate-700 rounded-md">
                  {getItemDisplay(item, index)}
                </div>
                <span className="text-purple-400 font-medium">
                  {percentages[index]?.toFixed(1)}%
                </span>
              </div>
              {allowRemove && items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Slider
              defaultValue={[percentages[index]]}
              max={100}
              step={1}
              value={[percentages[index]]}
              onValueChange={(values) => handleSliderChange(index, values)}
              className="py-2"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {allowAdd && (
        <div className="space-y-2 mt-4">
          {selectableOptions ? (
            // Searchable dropdown for selectable options
            <div className="flex gap-3">
              <div className="flex-1">
                <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dropdownOpen}
                      className="w-full justify-between bg-slate-800 border-slate-700 hover:bg-slate-700 text-left"
                    >
                      <span className="truncate">
                        {searchValue || newItemPlaceholder}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 bg-slate-900 border-slate-800 text-slate-200 w-full min-w-[220px]"
                    align="start"
                  >
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder={searchPlaceholder}
                        className="border-none focus:ring-0"
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup>
                          {getFilteredOptions().map((option, index) => {
                            const optionDisplay =
                              typeof option === "object"
                                ? option[displayKey]
                                : String(option);
                            const optionValue =
                              typeof option === "object"
                                ? option[valueKey]
                                : option;
                            const isSelected = isOptionSelected(option);

                            return (
                              <CommandItem
                                key={
                                  typeof optionValue === "object"
                                    ? index
                                    : optionValue
                                }
                                onSelect={() =>
                                  !isSelected && handleSelectItem(option)
                                }
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer hover:bg-slate-800",
                                  isSelected && "opacity-50 cursor-not-allowed",
                                )}
                              >
                                <div className="flex-1">{optionDisplay}</div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-purple-500" />
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            // Regular input field
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder={newItemPlaceholder}
                  value={newItemValue}
                  onChange={(e) => {
                    setNewItemValue(e.target.value);
                    if (newItemError) setNewItemError("");
                  }}
                  className="bg-slate-800 border-slate-700 focus-visible:ring-purple-500"
                />
              </div>
              <Button
                onClick={handleAddItem}
                variant="outline"
                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          )}

          {newItemError && (
            <p className="text-red-400 text-sm">{newItemError}</p>
          )}
          {!selectableOptions && getDataTypeHelper() && (
            <p className="text-xs text-slate-500">{getDataTypeHelper()}</p>
          )}
        </div>
      )}
    </div>
  );
}
