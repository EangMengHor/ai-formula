// CitationMiniCard.jsx

export default function CitationMiniCard({ cite }) {
  const stripHtml = (html = "") =>
    html
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  // allow either plain URL string or rich object
  const data = typeof cite === "string" ? { url: cite } : cite;
  const { url = "", title = "", siteName = "" } = data;

  // hostname & favicon (Google service, 64-px, always works)
  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }

  const icon = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;

  // clean title (strip HTML; fall back to hostname)
  const cleanedTitle = stripHtml(title).trim() || hostname;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-900 rounded-xl p-3 w-full hover:bg-[#2b2c2f] transition shadow"
    >
      {/* favicon + site */}
      <div className="flex items-center overflow-ellipsis line-clamp-1 gap-2 mb-1 p-1">
        <img src={icon} alt="" className="w-5 h-5 rounded-full" />
        <span className="text-sm text-gray-300 font-semibold flex-wrap">
          {siteName || hostname}
        </span>
      </div>

      {/* title (2-line clamp) */}
      <p className="text-sm text-gray-100 leading-snug line-clamp-2">
        {cleanedTitle.length > 7 ? cleanedTitle : ""}
      </p>
    </a>
  );
}
