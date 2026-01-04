import { Presentation } from "lucide-react";

export default function Presentations({
  images,
  htmlSlides,
  slidesQty,
  title,
}) {
  console.log("HTML Slides:", htmlSlides);
  console.log("PNG Slides:", images);
  console.log("Slides Quantity:", slidesQty);
  console.log("Title:", title);

  return (
    <div className=" rounded-lg bg-gray-900">
      <div className="flex p-3 gap-4 items-center">
        <Presentation />
        <div>
          <p>{title}</p>
          <p className="text-sm text-gray-400">{slidesQty} slides</p>
        </div>
      </div>
      <img
        src={images[0]?.url}
        alt="Presentation Preview"
        className="mt-4 w-full h-auto rounded-b-md border border-gray-700"
      />
    </div>
  );
}
