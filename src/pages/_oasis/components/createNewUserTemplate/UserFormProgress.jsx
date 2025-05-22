import RatioSlider from "@/components/custom/oasisCreateNewUser/RadioSlider";
import { Twitter } from "lucide-react";
import { useEffect, useState } from "react";

const socialPlatform = [
  {
    name: "Reddit",
    icon: <img src="/oasis/reddit-icon.svg" />,
    hoverColor: "red",
    value: "reddit",
  },
  {
    name: "X (Twitter)",
    icon: <img src="/oasis/twitter-icon.svg" />,
    hoverColor: "black",
    value: "twitter",
  },
];

const demographics = [
  {
    fieldName: "gender",
    initialItem: ["male", "female", "other"],
    initialRadios: [0.33, 0.33, 0.33],
    allowAdd: true,
    allowRemove: true,
    dataType: "string",
    newItemPlaceholder: "Add new gender",
    selectableOptions: null, // New prop for dropdown options
    searchPlaceholder: "Search options...",
  },
  // age
  {
    fieldName: "age",
    initialItem: ["18-24", "25-34", "35-44"],
    initialRadios: [0.33, 0.33, 0.33],
    allowAdd: true,
    allowRemove: true,
    dataType: "string",
    newItemPlaceholder: "Add new age group",
    selectableOptions: null, // New prop for dropdown options
    searchPlaceholder: "Search options...",
  },
  // MBTI Personality Type
  {
    fieldName: "mbti",
    initialItem: ["INTJ", "ENTP", "INFP"],
    initialRadios: [0.33, 0.33, 0.33],
    allowAdd: true,
    allowRemove: true,
    dataType: "string",
    newItemPlaceholder: "Add new MBTI type",
    // list of all MBTI types
    selectableOptions: [
      "INTJ",
      "INTP",
      "ENTJ",
      "ENTP",
      "INFJ",
      "INFP",
      "ENFJ",
      "ENFP",
      "ISTJ",
      "ISFJ",
      "ESTJ",
      "ESFJ",
      "ISTP",
      "ISFP",
      "ESTP",
      "ESFP",
    ],
    searchPlaceholder: "Search MBTI types...",
  },
];

export default function UserFormProgress() {
  // form Phase 1: Select Social media platform states
  const [selectedSocialPlatform, setSelectedSocialPlatform] =
    useState("reddit"); // or twitter
  const [isSocialPlatformSelected, setIsSocialPlatmformSelecte] =
    useState(false);
  const [formDataValues, setFormDataValues] = useState({
    gender: ["male", "female", "other"],
    genderRadio: [0.33, 0.33, 0.33],
    age: ["18-24", "25-34", "35-44"],
    ageRadio: [0.33, 0.33, 0.33],
    mbti: ["INTJ", "ENTP", "INFP"],
    mbtiRadio: [0.33, 0.33, 0.33],
  });
  // Generic handler for ratio changes
  const handleChange = (field) => (newRatios, newPercentages) => {
    setFormDataValues((prev) => ({
      ...prev,
      [`${field}Radio`]: newRatios,
    }));
    console.log("Changed", field, newRatios, newPercentages);
  };

  // Generic handler for item removal
  const handleRemoveItem = (field) => (index, newRatios) => {
    const newItems = formDataValues[field].filter((_, i) => i !== index);
    setFormDataValues((prev) => ({
      ...prev,
      [field]: newItems,
      [`${field}Radio`]: newRatios,
    }));
    console.log("Removed from", field, index, newRatios);
  };

  // Generic handler for adding items
  const handleAddItem = (field) => (newItem, newRatios) => {
    const newItems = [...formDataValues[field], newItem];
    setFormDataValues((prev) => ({
      ...prev,
      [field]: newItems,
      [`${field}Radio`]: newRatios,
    }));
    console.log("Added to", field, newItem, newRatios);
  };

  // Generic validator
  const validateItem = (field) => (value) => {
    if (formDataValues[field].includes(value)) {
      return "This item already exists";
    }

    return true;
  };
  useEffect(() => {
    console.log(formDataValues, "form data values");
  }, [formDataValues]);
  return (
    <div className="w-full h-full">
      {/* form phase 1  : Select social media platform */}
      {!isSocialPlatformSelected && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col gap-2 items-center justify-center h-[60%] w-[70%]">
            <div className="text-center text-white mb-10">
              <h3 className="font-semibold text-2xl">
                Choose a Social Media Platform to Create User Templates
              </h3>
              <p className="capitalize">
                User templates help you create groups of users for your social
                media simulations
              </p>
            </div>

            {/* select social media platform */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-full">
              {socialPlatform.map((platform) => (
                <div
                  onClick={() => {
                    setIsSocialPlatmformSelecte(true);
                    setSelectedSocialPlatform(platform.value);
                  }}
                  className={`cursor-pointer border-2 w-full rounded-md  flex-1 flex items-center justify-center flex-col 
                                        ${
                                          platform.hoverColor === "red"
                                            ? "border-red-900 hover:border-red-800 bg-red-700 hover:bg-red-900"
                                            : "border-slate-800 hover:border-slate-700 bg-slate-800 hover:bg-slate-900"
                                        }`}
                >
                  {/* icon */}
                  <div className="w-16 h-16">{platform.icon}</div>

                  {/* title */}
                  <div className="font-semibold text-lg text-white">
                    {platform.name}
                  </div>

                  {/* description */}
                  <div className="w-[50%]">
                    <p
                      className={`text-center ${platform.hoverColor == "red" ? "text-slate-300" : "text-slate-200"}`}
                    >
                      Create {platform.name} Users For Reddit Simulation
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* form phase 2 :  */}

      {/* field 1 */}
      {demographics.map((item, index) => {
        console.log(item, "item");
        return (
          <div key={index} className="w-full h-full flex flex-col gap-2 mt-4">
            <h3 className="text-lg font-semibold text-white">
              {item.fieldName}
            </h3>
            <RatioSlider
              items={item.initialItem}
              initialRadios={item.initialRadios}
              allowAdd={item.allowAdd}
              allowRemove={item.allowRemove}
              dataType={item.dataType}
              newItemPlaceholder={item.newItemPlaceholder}
              onChange={handleChange(item.fieldName)}
              onRemove={handleRemoveItem(item.fieldName)}
              onAdd={handleAddItem(item.fieldName)}
              validateNewItem={validateItem(item.fieldName)}
              selectableOptions={item.selectableOptions} // Pass the new prop here
              searchPlaceholder={item.searchPlaceholder} // Pass the new prop here
            />
          </div>
        );
      })}
    </div>
  );
}
