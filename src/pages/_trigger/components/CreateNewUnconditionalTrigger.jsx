import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewUnconditionalTrigger } from "@/services/trigger/createNewUnconditionalTriggerApi";
import {
  Calendar,
  Clock,
  Mail,
  CheckCircle,
  User,
  Zap,
  Brain,
  ChevronRight,
  X,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function CreateNewUnconditionalTrigger({ onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [createdTrigger, setCreatedTrigger] = useState(null);
  const { toast } = useToast();
  const [newUnconditionalTriggerData, setNewUnconditionalTriggerData] =
    useState({
      frequency: "",
      times: [],
      weekDays: [],
      monthDays: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isAgentInvokation: false,
      email: "",
      prompt: "",
      outputFormat: "Complete Report",
    });

  // Helper function to generate time slots with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
        const displayTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push({ value: timeString, display: displayTime });
      }
    }
    return slots;
  };

  // Helper function to format time for display
  const formatTimeDisplay = (timeString) => {
    const [hour, minute] = timeString.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour =
      hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Helper function to generate natural language confirmation
  const generateConfirmationMessage = () => {
    const { frequency, times, weekDays, monthDays, timezone } =
      newUnconditionalTriggerData;

    const timezoneDisplay = timezone ? ` (${timezone} timezone)` : "";

    if (frequency === "daily") {
      if (times.length === 0) return "";
      const timeList = times.map((time) => formatTimeDisplay(time));
      return `Your trigger will run daily at ${timeList.join(", ")}${timezoneDisplay}.`;
    } else if (frequency === "weekly") {
      if (weekDays.length === 0 || times.length === 0) return "";
      const dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const dayList = weekDays.map((day) => dayNames[day - 1]);
      const timeList = times.map((time) => formatTimeDisplay(time));
      return `Your trigger will run on ${dayList.join(", ")} at ${timeList.join(", ")}${timezoneDisplay}.`;
    } else if (frequency === "monthly") {
      if (monthDays.length === 0 || times.length === 0) return "";
      const getOrdinal = (num) => {
        const suffixes = ["th", "st", "nd", "rd"];
        const mod = num % 100;
        return (
          num + (suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0])
        );
      };
      const dayList = monthDays.map((day) => getOrdinal(day));
      const timeList = times.map((time) => formatTimeDisplay(time));
      return `Your trigger will run on the ${dayList.join(", ")} of each month at ${timeList.join(", ")}${timezoneDisplay}.`;
    }
    return "";
  };

  // Handle time selection
  const handleTimeToggle = (timeValue) => {
    const currentTimes = newUnconditionalTriggerData.times;
    if (currentTimes.includes(timeValue)) {
      setNewUnconditionalTriggerData((prev) => ({
        ...prev,
        times: currentTimes.filter((t) => t !== timeValue),
      }));
    } else if (currentTimes.length < 10) {
      setNewUnconditionalTriggerData((prev) => ({
        ...prev,
        times: [...currentTimes, timeValue].sort(),
      }));
    }
  };

  // Handle day selection (for weekly/monthly)
  const handleDayToggle = (dayValue, type) => {
    const currentDays =
      type === "week"
        ? newUnconditionalTriggerData.weekDays
        : newUnconditionalTriggerData.monthDays;
    const updateKey = type === "week" ? "weekDays" : "monthDays";

    if (currentDays.includes(dayValue)) {
      setNewUnconditionalTriggerData((prev) => ({
        ...prev,
        [updateKey]: currentDays.filter((d) => d !== dayValue),
      }));
    } else {
      setNewUnconditionalTriggerData((prev) => ({
        ...prev,
        [updateKey]: [...currentDays, dayValue].sort((a, b) => a - b),
      }));
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="w-full flex flex-col gap-4 overflow-scroll justify-start items-center">
      <div className="flex flex-col gap-2 max-w-4xl w-full h-full items-start justify-center">
        {/* Header */}
        <div className="flex flex-col my-4">
          <h2 className="text-2xl font-medium text-white">
            New Unconditional Trigger
          </h2>
          <p className="text-lg text-gray-500 font-semibold">
            Create a scheduled trigger that runs automatically at specific
            intervals.
          </p>
          {/* Timezone Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">
              Your current timezone:{" "}
              <span className="text-blue-400 font-medium">
                {newUnconditionalTriggerData.timezone || "Loading..."}
              </span>
            </span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? "bg-blue-500 text-white"
                    : "bg-slate-600 text-slate-300"
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <ChevronRight className="w-4 h-4 text-slate-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Frequency Selection */}
        {currentStep === 1 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Choose Frequency
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Daily Card */}
              <div
                onClick={() =>
                  setNewUnconditionalTriggerData((prev) => ({
                    ...prev,
                    frequency: "daily",
                    weekDays: [],
                    monthDays: [],
                  }))
                }
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  newUnconditionalTriggerData.frequency === "daily"
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50"
                }`}
              >
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                  <h4 className="text-white font-medium mb-2">Daily</h4>
                  <p className="text-slate-400 text-sm">
                    Run every day at specified times
                  </p>
                </div>
              </div>

              {/* Weekly Card */}
              <div
                onClick={() =>
                  setNewUnconditionalTriggerData((prev) => ({
                    ...prev,
                    frequency: "weekly",
                    monthDays: [],
                  }))
                }
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  newUnconditionalTriggerData.frequency === "weekly"
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50"
                }`}
              >
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-green-400" />
                  <h4 className="text-white font-medium mb-2">Weekly</h4>
                  <p className="text-slate-400 text-sm">
                    Run on specific days of the week
                  </p>
                </div>
              </div>

              {/* Monthly Card */}
              <div
                onClick={() =>
                  setNewUnconditionalTriggerData((prev) => ({
                    ...prev,
                    frequency: "monthly",
                    weekDays: [],
                  }))
                }
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  newUnconditionalTriggerData.frequency === "monthly"
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50"
                }`}
              >
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                  <h4 className="text-white font-medium mb-2">Monthly</h4>
                  <p className="text-slate-400 text-sm">
                    Run on specific days of the month
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration based on frequency */}
            {newUnconditionalTriggerData.frequency && (
              <div className="bg-slate-800/50 rounded-xl p-6 space-y-6">
                {/* Daily Configuration */}
                {newUnconditionalTriggerData.frequency === "daily" && (
                  <div>
                    <h4 className="text-white font-medium mb-4">
                      Select Times (up to 10)
                    </h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          onClick={() => handleTimeToggle(slot.value)}
                          className={`p-2 text-xs rounded transition-all ${
                            newUnconditionalTriggerData.times.includes(
                              slot.value,
                            )
                              ? "bg-blue-500 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {slot.display}
                        </button>
                      ))}
                    </div>
                    {newUnconditionalTriggerData.times.length > 0 && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm mb-2">
                          Selected times:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {newUnconditionalTriggerData.times.map((time) => (
                            <span
                              key={time}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 text-xs"
                            >
                              {formatTimeDisplay(time)}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => handleTimeToggle(time)}
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weekly Configuration */}
                {newUnconditionalTriggerData.frequency === "weekly" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-4">
                        Select Days of Week
                      </h4>
                      <div className="grid grid-cols-7 gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day, index) => (
                            <button
                              key={day}
                              onClick={() => handleDayToggle(index + 1, "week")}
                              className={`p-3 text-sm rounded transition-all ${
                                newUnconditionalTriggerData.weekDays.includes(
                                  index + 1,
                                )
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              {day}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">
                        Select Times (up to 10)
                      </h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => handleTimeToggle(slot.value)}
                            className={`p-2 text-xs rounded transition-all ${
                              newUnconditionalTriggerData.times.includes(
                                slot.value,
                              )
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                      {newUnconditionalTriggerData.times.length > 0 && (
                        <div className="mt-4">
                          <p className="text-slate-400 text-sm mb-2">
                            Selected times:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {newUnconditionalTriggerData.times.map((time) => (
                              <span
                                key={time}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 text-xs"
                              >
                                {formatTimeDisplay(time)}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => handleTimeToggle(time)}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Monthly Configuration */}
                {newUnconditionalTriggerData.frequency === "monthly" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-4">
                        Select Days of Month (1-31)
                      </h4>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (day) => (
                            <button
                              key={day}
                              onClick={() => handleDayToggle(day, "month")}
                              className={`p-2 text-sm rounded transition-all ${
                                newUnconditionalTriggerData.monthDays.includes(
                                  day,
                                )
                                  ? "bg-purple-500 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              {day}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">
                        Select Times (up to 10)
                      </h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => handleTimeToggle(slot.value)}
                            className={`p-2 text-xs rounded transition-all ${
                              newUnconditionalTriggerData.times.includes(
                                slot.value,
                              )
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                      {newUnconditionalTriggerData.times.length > 0 && (
                        <div className="mt-4">
                          <p className="text-slate-400 text-sm mb-2">
                            Selected times:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {newUnconditionalTriggerData.times.map((time) => (
                              <span
                                key={time}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 text-xs"
                              >
                                {formatTimeDisplay(time)}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => handleTimeToggle(time)}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirmation Message */}
                {generateConfirmationMessage() && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">
                      <strong>Schedule Preview:</strong>{" "}
                      {generateConfirmationMessage()}
                    </p>
                  </div>
                )}

                {/* Navigation Buttons for Step 1 */}
                <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={
                      !newUnconditionalTriggerData.frequency ||
                      newUnconditionalTriggerData.times.length === 0 ||
                      (newUnconditionalTriggerData.frequency === "weekly" &&
                        newUnconditionalTriggerData.weekDays.length === 0) ||
                      (newUnconditionalTriggerData.frequency === "monthly" &&
                        newUnconditionalTriggerData.monthDays.length === 0)
                    }
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400"
                  >
                    Continue to Agent Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Agent Invocation */}
        {currentStep === 2 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Agent Reasoning
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Quick Reasoning */}
              <div
                onClick={() =>
                  setNewUnconditionalTriggerData((prev) => ({
                    ...prev,
                    isAgentInvokation: false,
                  }))
                }
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  !newUnconditionalTriggerData.isAgentInvokation
                    ? "bg-green-500/20 border-2 border-green-500"
                    : "bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50"
                }`}
              >
                <div className="text-center">
                  <Zap className="w-8 h-8 mx-auto mb-3 text-green-400" />
                  <h4 className="text-white font-medium mb-2">
                    Quick Reasoning
                  </h4>
                  <p className="text-slate-400 text-sm">
                    Fast execution with basic processing
                  </p>
                </div>
              </div>

              {/* Agentic Reasoning */}
              <div
                onClick={() =>
                  setNewUnconditionalTriggerData((prev) => ({
                    ...prev,
                    isAgentInvokation: true,
                  }))
                }
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  newUnconditionalTriggerData.isAgentInvokation
                    ? "bg-purple-500/20 border-2 border-purple-500"
                    : "bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50"
                }`}
              >
                <div className="text-center">
                  <Brain className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                  <h4 className="text-white font-medium mb-2">
                    Agentic Reasoning
                  </h4>
                  <p className="text-slate-400 text-sm">
                    Advanced AI agents for complex analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
              >
                Back to Schedule
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Continue to Prompt
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Prompt & Output Format */}
        {currentStep === 3 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Prompt & Output Format
              </h3>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
              <div>
                <Label
                  htmlFor="prompt"
                  className="text-base text-white/70 mb-2 block"
                >
                  Prompt
                </Label>
                <Textarea
                  value={newUnconditionalTriggerData.prompt}
                  onChange={(e) =>
                    setNewUnconditionalTriggerData({
                      ...newUnconditionalTriggerData,
                      prompt: e.target.value,
                    })
                  }
                  id="prompt"
                  className="w-full bg-slate-700/50 border-slate-600 text-white min-h-[120px] placeholder-slate-400 focus:border-blue-500"
                  placeholder="Describe what you want the trigger to do..."
                />
              </div>

              <div>
                <Label
                  htmlFor="outputFormat"
                  className="text-base text-white/70 mb-2 block"
                >
                  Output Format
                </Label>
                <Textarea
                  value={newUnconditionalTriggerData.outputFormat}
                  onChange={(e) =>
                    setNewUnconditionalTriggerData({
                      ...newUnconditionalTriggerData,
                      outputFormat: e.target.value,
                    })
                  }
                  id="outputFormat"
                  className="w-full bg-slate-700/50 border-slate-600 text-white min-h-[120px] placeholder-slate-400 focus:border-blue-500"
                  placeholder="Specify the desired output format..."
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
                >
                  Back to Agent Settings
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={
                    !newUnconditionalTriggerData.prompt.trim() ||
                    !newUnconditionalTriggerData.outputFormat.trim()
                  }
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400"
                >
                  Continue to Email Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Email Recipients */}
        {currentStep === 4 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Email Recipients
              </h3>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
              <div>
                <Label
                  htmlFor="email"
                  className="text-base text-white/70 mb-2 block"
                >
                  Email Addresses
                </Label>
                <p className="text-sm text-slate-400 mb-3">
                  Enter email addresses separated by commas. You'll receive
                  notifications when the trigger runs.
                </p>
                <Input
                  value={newUnconditionalTriggerData.email}
                  onChange={(e) =>
                    setNewUnconditionalTriggerData({
                      ...newUnconditionalTriggerData,
                      email: e.target.value,
                    })
                  }
                  id="email"
                  type="email"
                  className="w-full bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                  placeholder="example@domain.com, another@domain.com"
                />
                {newUnconditionalTriggerData.email && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">
                      Email addresses to notify:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {newUnconditionalTriggerData.email
                        .split(",")
                        .map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-xs"
                          >
                            <Mail className="w-3 h-3" />
                            {email.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                <Button
                  onClick={() => setCurrentStep(3)}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
                >
                  Back to Prompt
                </Button>
                <Button
                  onClick={() => setCurrentStep(5)}
                  disabled={!newUnconditionalTriggerData.email.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400"
                >
                  Review & Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation & Creation */}
        {currentStep === 5 && !createdTrigger && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Review & Create Trigger
              </h3>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 space-y-6">
              {/* Schedule Summary */}
              <div>
                <h4 className="text-white font-medium mb-2">Schedule</h4>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {generateConfirmationMessage()}
                  </p>
                </div>
              </div>

              {/* Agent Settings */}
              <div>
                <h4 className="text-white font-medium mb-2">Processing Mode</h4>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {newUnconditionalTriggerData.isAgentInvokation
                      ? "Agentic Reasoning"
                      : "Quick Reasoning"}
                  </p>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <h4 className="text-white font-medium mb-2">Prompt</h4>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {newUnconditionalTriggerData.prompt}
                  </p>
                </div>
              </div>

              {/* Output Format */}
              <div>
                <h4 className="text-white font-medium mb-2">Output Format</h4>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {newUnconditionalTriggerData.outputFormat}
                  </p>
                </div>
              </div>

              {/* Email Recipients */}
              <div>
                <h4 className="text-white font-medium mb-2">
                  Email Recipients
                </h4>
                <div className="flex flex-wrap gap-2">
                  {newUnconditionalTriggerData.email
                    .split(",")
                    .map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs"
                      >
                        <Mail className="w-3 h-3" />
                        {email.trim()}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                <Button
                  onClick={() => setCurrentStep(4)}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
                >
                  Back to Email Settings
                </Button>
                <Button
                  disabled={loading}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const result = await createNewUnconditionalTrigger({
                        prompt: newUnconditionalTriggerData.prompt,
                        type: "unconditional",
                        outputFormat: newUnconditionalTriggerData.outputFormat,
                        userId: user?.id,
                        frequency: newUnconditionalTriggerData.frequency,
                        times: newUnconditionalTriggerData.times,
                        weekDays: newUnconditionalTriggerData.weekDays,
                        monthDays: newUnconditionalTriggerData.monthDays,
                        timezone: newUnconditionalTriggerData.timezone,
                        isAgentInvokation:
                          newUnconditionalTriggerData.isAgentInvokation,
                        email: newUnconditionalTriggerData.email,
                      });

                      if (result) {
                        setCreatedTrigger(result);

                        // Show success toast
                        toast({
                          title: "Trigger Created Successfully!",
                          description: `${result.name} has been created and scheduled.`,
                          variant: "default",
                        });

                        // Close dialog after a short delay to show the success state
                        setTimeout(() => {
                          if (onClose) {
                            onClose();
                          }
                        }, 2000);
                      }
                    } catch (error) {
                      console.error(
                        "Error creating unconditional trigger:",
                        error,
                      );

                      // Show error toast
                      toast({
                        title: "Error Creating Trigger",
                        description:
                          "Failed to create the trigger. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 font-medium"
                >
                  {loading
                    ? "Creating Trigger..."
                    : "Create New Unconditional Trigger"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {createdTrigger && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Unconditional Trigger Created Successfully
                </h3>
              </div>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 space-y-6">
              {/* Header Info */}
              <div className="border-b border-slate-700 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-1">
                      {createdTrigger.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        ID: {createdTrigger.id}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Frequency: {createdTrigger.frequency}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>

              {/* Schedule Info */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Schedule
                </h5>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {generateConfirmationMessage()}
                  </p>
                </div>
              </div>

              {/* Prompt Section */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Prompt
                </h5>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">{createdTrigger.prompt}</p>
                </div>
              </div>

              {/* Output Format Section */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Output Format
                </h5>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-white text-sm">
                    {createdTrigger.outputformat}
                  </p>
                </div>
              </div>

              {/* Email Notifications */}
              <div>
                <h5 className="text-sm font-medium text-slate-300 mb-2">
                  Email Notifications
                </h5>
                <div className="flex flex-wrap gap-2">
                  {createdTrigger.email.split(",").map((email, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs"
                    >
                      <Mail className="w-3 h-3" />
                      {email.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => {
                    setCurrentStep(1);
                    setCreatedTrigger(null);
                    setNewUnconditionalTriggerData({
                      frequency: "",
                      times: [],
                      weekDays: [],
                      monthDays: [],
                      timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                      isAgentInvokation: false,
                      email: "",
                      prompt: "",
                      outputFormat: "Complete Report",
                    });
                  }}
                  className="bg-white text-black hover:bg-gray-100 font-medium"
                >
                  Create Another Trigger
                </Button>
                <Button
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      window.location.reload();
                    }
                  }}
                  variant="outline"
                  className="bg-white border-slate-300 text-black hover:bg-gray-100"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
