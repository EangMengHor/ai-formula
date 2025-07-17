import {
  Clock,
  MessageCircle,
  MessageSquare,
  Search,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { Input } from "../ui/input";
import { searchChat } from "@/services/search/searchChat";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export default function SearchChats() {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]); // State to hold search results
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const { user } = useUser();
  //   dialog box
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
   
  const handleRedirection = (sessionId) => {
    setDialogOpen(false);
    navigate(`/chat/${sessionId}`);
  };
 
  const handleSearch = useCallback(
    debounce(async (value) => {
      if (!user || !user.id) {
        console.error("User is not authenticated", user);
        setIsError(true);
        return;
      }
      try {
        setIsLoading(true);
        setIsError(false);

        // api
        const results = await searchChat(value, user.id);
        if (results.length === 0) {
          setIsEmpty(true);
          setSearchResults([]);
        } else {
          setIsEmpty(false);
          console.log(
            "Search results:",
            value === searchValue,
            value,
            searchValue,
            results,
          );
          setSearchResults(results);
        }
        console.log("Search results:", results);
      } catch (error) {
        console.error("Error during search:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    [],
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    handleSearch(value);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger className="w-full">
        <div className="cursor-pointer px-2  hover:bg-slate-800  mt-2 mx-2 rounded-md">
          <div className="flex gap-2 items-center">
            <div className=" flex gap-1 items-center p-1">
              <Search className="w-4 rounded-md" />
            </div>
            <p className="font-bold">Search Chat</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl gap-0 rounded-2xl p-0 bg-gradient-to-r from-g2 to-g1 border-0 text-white [&>button]:hidden">
        <div className="flex border-b-2 border-b-slate-800 p-2 items-center">
          <Search className="w-5 mx-3" />
          <Input
            type="text"
            value={searchValue}
            onChange={handleChange}
            placeholder="Type to search..."
            className="w-[95%] p-2 rounded-md border-0 text-white focus-visible:ring-transparent"
          />
          <div
            onClick={() => {
              setDialogOpen(false);
            }}
            className="rounded-lg cursor-pointer hover:bg-g2 p-2"
          >
            <X className="w-6 h-6" />
          </div>
        </div>
        <div className="p-2 mb-4 overflow-y-scroll hide-scrollbar h-[calc(100vh-400px)]">
          {/* start searching */}
          {searchValue.length == 0 && !isError && (
            <div className="w-full h-full flex flex-col items-center justify-center ">
              <Search />
              <p>Enter Your Search</p>
              <p className="max-w-lg mt-4 text-center text-slate-400">
                The search results will include both entire chat threads and
                individual messages within those threads.
              </p>
            </div>
          )}

          {isError && (
            <div className="w-full h-full flex flex-col items-center justify-center ">
              <p className="text-red-500">An error occurred while searching.</p>
            </div>
          )}

          {isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in text-white py-10">
              <div className="border-4 border-t-transparent border-white/50 rounded-full w-8 h-8 animate-spin mb-4" />
              <p className="text-white/90 font-medium">
                Searching your chats...
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Hang tight, this won’t take long.
              </p>
            </div>
          )}

          {/* Render search results */}
          <div className="flex flex-col gap-2">
            {searchResults.length > 0 &&
              !isLoading &&
              searchResults.map((result, index) => {
                const parsedContent = result.content
                  ? result.content.replace(
                      /\*\*(.*?)\*\*/g,
                      "<strong>$1</strong>",
                    )
                  : "";
                const parsedChatName = result.chatname
                  ? result.chatname.replace(
                      /\*\*(.*?)\*\*/g,
                      "<strong>$1</strong>",
                    )
                  : "";
                return (
                  <div
                    key={index}
                    onClick={() => handleRedirection(result.sessionid)}
                    className="p-4 rounded-xl  bg-white/5 backdrop-blur-md hover:bg-white/10 cursor-pointer shadow-md hover:shadow-lg transition-all flex items-start gap-4"
                  >
                    <div className="pt-1">
                      <MessageCircle />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center">
                        <p
                          className="text-sm text-slate-300 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: parsedChatName }}
                        />
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                          {result.type}
                        </span>
                      </div>
                      {result.content && (
                        <p
                          className="text-sm text-slate-300 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: parsedContent }}
                        />
                      )}
                      <div className="flex items-center text-xs text-slate-400 gap-1 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{result.relativeTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* View for no search results */}
          {isEmpty && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <SearchX className="h-12 w-12 text-gray-400" />
              <p className="text-gray-400">No results found for your search.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
