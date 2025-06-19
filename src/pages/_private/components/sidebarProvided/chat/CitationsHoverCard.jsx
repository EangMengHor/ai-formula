import { stripHtml, urlToCompanyNameExtractor } from "../../../../../lib/utils";

export default function CitationHoverCard({ index, metadata }) {
    // 1️⃣ Normalise input
    const data = typeof metadata === "string" ? { url: metadata } : metadata;
    const { url = "", title = "", description = "", siteName = "" } = data;

    // 2️⃣ Host + rock-solid favicon (Google service, 64-px)
    let hostname = url;
    try {
        hostname = new URL(url).hostname.replace(/^www\./, "");
    } catch {
        /* keep raw url */
    }
    const icon = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;

    // 3️⃣ Clean title / description (strip tags, trim)
    const cleanTitle = stripHtml(title).trim();
    const finalTitle =
        cleanTitle.length >= 4 && !/^https?:/i.test(cleanTitle)
            ? cleanTitle
            : siteName || hostname;

    const cleanDesc = stripHtml(description).trim();
    const finalDesc = cleanDesc.length >= 10 ? cleanDesc : "";
    return (
        <span className="relative inline-block group ml-1 mr-1 mt-2">
            {/* superscript number */}
            <sup
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                className="cursor-pointer text-white bg-slate-800 hover:bg-slate-900 text-[0.5rem] leading-none w-5 h-5 px-[5px] py-[1px] rounded-full"
            >
                {`${urlToCompanyNameExtractor(url) || index + 1}`}
            </sup>



            {/* pop-over */}
            <div className="absolute z-20 hidden group-hover:block bg-slate-900 text-white p-3 rounded-lg shadow-lg w-80 mt-2">
                {/* favicon + host */}
                <div className="flex items-center gap-2 mb-2">
                    <img src={icon} alt="" className="w-5 h-5 rounded-full" />
                    <span className="font-semibold text-sm">
                        {hostname ? hostname : ""}
                    </span>
                </div>

                {/* title */}
                {finalTitle && (
                    <p className="text-xs font-medium leading-snug mb-1">
                        {finalTitle}
                    </p>
                )}

                {/* description (clamped) */}
                {finalDesc &&
                    !finalDesc?.toLowerCase().includes("no description") && (
                        <p className="text-xs text-gray-300 leading-snug line-clamp-3">
                            {finalDesc}
                        </p>
                    )}

                {/* raw link */}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline text-xs break-all mt-2 inline-block"
                >
                    {url}
                </a>
            </div>
        </span>
    );
}
