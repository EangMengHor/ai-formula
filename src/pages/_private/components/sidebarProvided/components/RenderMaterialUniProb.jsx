import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import * as $3Dmol from "3dmol";
import {
  Loader2,
  Info,
  Calendar,
  Database,
  Download,
  ExternalLink,
  Edit3,
  Globe,
} from "lucide-react";

export default function RenderMaterialUniProb({ uniProbId, title }) {
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isLoadingPAE, setIsLoadingPAE] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'api', 'file', 'pae', 'render'
  const [fileFormat, setFileFormat] = useState(null);
  const [proteinData, setProteinData] = useState(null);
  const [paeImageData, setPaeImageData] = useState(null);
  const [paeError, setPaeError] = useState(false);
  const viewerRef = useRef();
  const viewerInstanceRef = useRef(null);
  console.log("RenderMaterialUniProb component initialized", uniProbId, title);
  // Memoize the API call to prevent unnecessary re-renders
  const fetchProteinInfo = useCallback(async (uniProtId) => {
    try {
      setIsLoadingAPI(true);
      setError(null);
      setErrorType(null);

      if (!uniProtId || uniProtId.trim() === "") {
        throw new Error("Invalid UniProt ID provided");
      }

      const response = await axios.get(
        `https://alphafold.ebi.ac.uk/api/prediction/${uniProtId}`,
        { timeout: 50000 },
      );

      if (!response.data) {
        throw new Error("No response data received from AlphaFold API");
      }

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(
          `No protein structure found for UniProt ID: ${uniProtId}. This protein may not be available in AlphaFold database.`,
        );
      }

      const proteinInfo = response.data[0];

      // Validate required URLs
      if (!proteinInfo.cifUrl && !proteinInfo.pdbUrl) {
        throw new Error(
          "No downloadable structure files available for this protein",
        );
      }

      return proteinInfo;
    } catch (err) {
      console.error("Failed to fetch protein info:", err);
      setErrorType("api");

      if (err.code === "ECONNABORTED") {
        throw new Error(
          "Request timeout - AlphaFold API is taking too long to respond",
        );
      } else if (err.response?.status === 404) {
        throw new Error(
          `Protein not found: UniProt ID "${uniProtId}" does not exist in AlphaFold database`,
        );
      } else if (err.response?.status === 500) {
        throw new Error("AlphaFold API server error - please try again later");
      } else if (err.response?.status >= 400) {
        throw new Error(
          `API Error (${err.response.status}): ${err.response.statusText}`,
        );
      } else if (err.message.includes("Network Error")) {
        throw new Error(
          "Network connection failed - please check your internet connection",
        );
      }

      throw err;
    } finally {
      setIsLoadingAPI(false);
    }
  }, []);

  // Memoize structure file fetching
  const fetchStructureFile = useCallback(async (url, format) => {
    try {
      setIsLoadingFile(true);
      setError(null);
      setErrorType(null);

      if (!url) {
        throw new Error(`${format.toUpperCase()} file URL is not available`);
      }

      const response = await axios.get(url, {
        timeout: 20000,
        responseType: "text",
      });

      if (!response.data || response.data.trim() === "") {
        throw new Error(
          `Downloaded ${format.toUpperCase()} file is empty or corrupted`,
        );
      }

      return response.data;
    } catch (err) {
      console.error("Failed to fetch structure file:", err);
      setErrorType("file");

      if (err.code === "ECONNABORTED") {
        throw new Error(
          `Timeout downloading ${format.toUpperCase()} file - file may be too large`,
        );
      } else if (err.response?.status === 404) {
        throw new Error(
          `Structure file not found: ${format.toUpperCase()} file is no longer available`,
        );
      } else if (err.response?.status >= 400) {
        throw new Error(
          `Failed to download ${format.toUpperCase()} file (${err.response.status}): ${err.response.statusText}`,
        );
      }

      throw new Error(
        `Failed to download protein structure file: ${err.message}`,
      );
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  // Function to fetch PAE plot image
  const fetchPAEImage = useCallback(async (imageUrl) => {
    try {
      setIsLoadingPAE(true);
      setPaeError(false);

      if (!imageUrl) {
        setPaeError(true);
        console.warn("PAE image URL not available");
        return;
      }

      const response = await axios.get(imageUrl, {
        responseType: "blob",
        timeout: 15000,
      });

      if (!response.data || response.data.size === 0) {
        throw new Error("PAE image file is empty");
      }

      // Create object URL for the image blob
      const imageObjectURL = URL.createObjectURL(response.data);
      setPaeImageData(imageObjectURL);

      console.log("Successfully loaded PAE image");
    } catch (err) {
      console.error("Failed to fetch PAE image:", err);
      setPaeError(true);
      // Don't throw error for PAE image failure, just log it
    } finally {
      setIsLoadingPAE(false);
    }
  }, []);

  // Optimized protein structure rendering
  const renderProteinStructure = useCallback((data, format) => {
    try {
      const element = viewerRef.current;
      if (!element) {
        throw new Error("3D viewer container not found");
      }

      // Clear any existing viewer
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.clear();
      }
      element.innerHTML = "";

      const config = {
        backgroundColor: "#0F172A",
        antialias: true,
        quality: "high",
      };

      const viewer = $3Dmol.createViewer(element, config);
      viewerInstanceRef.current = viewer;

      // Add model with appropriate format
      const model = viewer.addModel(data, format);

      if (!model) {
        throw new Error(
          `Failed to parse ${format.toUpperCase()} file - invalid structure data`,
        );
      }

      // Enhanced cartoon style with better colors
      viewer.setStyle(
        {},
        {
          cartoon: {
            color: "spectrum",
            thickness: 1.2,
            opacity: 0.9,
          },
        },
      );

      viewer.zoomTo();
      viewer.render();

      console.log(`Successfully rendered ${format.toUpperCase()} structure`);
    } catch (err) {
      console.error("Error rendering protein structure:", err);
      setErrorType("render");
      setError(`Failed to render 3D structure: ${err.message}`);
    }
  }, []);

  // Function to open mol3D dashboard with error handling
  const openMol3DDashboard = useCallback(() => {
    try {
      if (!proteinData?.cifUrl) {
        setError("CIF file URL not available for Mol3D editor");
        setErrorType("url");
        return;
      }

      const mol3DUrl = `https://material-science.jamesscott.tech/?load-url=${encodeURIComponent(proteinData.cifUrl)}`;
      window.open(mol3DUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError("Failed to open Mol3D editor");
      setErrorType("url");
    }
  }, [proteinData?.cifUrl]);

  // Function to open AlphaFold database entry
  const openAlphaFoldEntry = useCallback(() => {
    if (uniProbId) {
      const alphaFoldUrl = `https://alphafold.ebi.ac.uk/entry/${uniProbId}`;
      window.open(alphaFoldUrl, "_blank", "noopener,noreferrer");
    }
  }, [uniProbId]);

  useEffect(() => {
    if (!uniProbId) {
      setError("No UniProt ID provided");
      setErrorType("input");
      return;
    }

    async function fetchAndRender() {
      try {
        setError(null);
        setErrorType(null);
        setProteinData(null);
        setPaeImageData(null);
        setPaeError(false);

        // Fetch protein information from API
        const proteinInfo = await fetchProteinInfo(uniProbId);
        setProteinData(proteinInfo);

        // Try CIF first, fallback to PDB
        let structureUrl = proteinInfo.cifUrl;
        let format = "cif";

        if (!structureUrl && proteinInfo.pdbUrl) {
          structureUrl = proteinInfo.pdbUrl;
          format = "pdb";
          console.warn("CIF file not available, using PDB format");
        }

        if (!structureUrl) {
          throw new Error(
            "No structure files (CIF or PDB) available for this protein",
          );
        }

        setFileFormat(format);

        // Fetch structure file
        const structureData = await fetchStructureFile(structureUrl, format);
        renderProteinStructure(structureData, format);

        // Fetch PAE image separately (non-blocking)
        if (proteinInfo.paeImageUrl) {
          fetchPAEImage(proteinInfo.paeImageUrl);
        } else {
          setPaeError(true);
        }

        console.log("Successfully loaded protein data:", proteinInfo);
      } catch (err) {
        console.error("Error loading protein structure:", err);
        setError(err.message || "Failed to load protein structure");
      }
    }

    fetchAndRender();
  }, [uniProbId]);

  // Single cleanup function
  useEffect(() => {
    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.clear();
        } catch (err) {
          console.error("Error clearing viewer:", err);
        }
      }
      // Clean up object URL when component unmounts
      if (paeImageData) {
        URL.revokeObjectURL(paeImageData);
      }
    };
  }, []);

  // Clean up PAE image URL when it changes
  useEffect(() => {
    return () => {
      if (paeImageData) {
        URL.revokeObjectURL(paeImageData);
      }
    };
  }, [paeImageData]);

  // Memoize loading state
  const isLoading = useMemo(
    () => isLoadingAPI || isLoadingFile,
    [isLoadingAPI, isLoadingFile],
  );

  // Memoize loading message
  const loadingMessage = useMemo(() => {
    if (isLoadingAPI) return "Fetching protein information...";
    if (isLoadingFile) return "Downloading structure file...";
    return "Loading...";
  }, [isLoadingAPI, isLoadingFile]);

  // Enhanced error message component
  const renderError = () => {
    const getErrorIcon = () => {
      switch (errorType) {
        case "api":
          return "🌐";
        case "file":
          return "📁";
        case "render":
          return "🎨";
        case "url":
          return "🔗";
        case "input":
          return "⚠️";
        default:
          return "❌";
      }
    };

    const getErrorTitle = () => {
      switch (errorType) {
        case "api":
          return "API Connection Error";
        case "file":
          return "File Download Error";
        case "render":
          return "3D Rendering Error";
        case "url":
          return "URL Error";
        case "input":
          return "Input Error";
        default:
          return "Error";
      }
    };

    return (
      <div className="text-center text-red-400 p-6 max-w-md mx-auto">
        <div className="text-4xl mb-3">{getErrorIcon()}</div>
        <p className="text-lg font-semibold mb-2">{getErrorTitle()}</p>
        <p className="text-sm text-slate-300 mb-3">{error}</p>
        <p className="text-xs text-slate-500">UniProt ID: {uniProbId}</p>
        {errorType === "api" && (
          <p className="text-xs text-slate-400 mt-2">
            Try checking if the UniProt ID is correct or try again later
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 m-4">
      {/* Header Section */}
      <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
        <div className="flex flex-row-reverse items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              {title || "UniProt Protein Structure"}
            </h2>
            {proteinData && (
              <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                {proteinData.uniprotAccession}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AlphaFold Database Entry Button */}
            <button
              onClick={openAlphaFoldEntry}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
            >
              <Globe className="w-4 h-4" />
              AlphaFold DB
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* Mol3D Editor Button */}
            {proteinData?.cifUrl && (
              <button
                onClick={openMol3DDashboard}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm border border-blue-500/30 hover:border-blue-400/50"
              >
                <Edit3 className="w-4 h-4" />
                Edit in Mol3D
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D Viewer - Visual on Top */}
      <div className="relative w-full h-[500px] border-2 border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm z-20">
            <div className="text-center text-slate-100">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-3 text-blue-400" />
              <p className="text-sm font-medium">{loadingMessage}</p>
              {proteinData && (
                <p className="text-xs text-slate-400 mt-2 max-w-xs truncate">
                  {proteinData.uniprotDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            {renderError()}
          </div>
        )}

        <div
          ref={viewerRef}
          className="w-full h-full bg-slate-900 rounded-lg"
        />

        {/* Overlay badges */}
        {fileFormat && !isLoading && !error && (
          <div className="absolute bottom-3 right-3 bg-slate-800/90 backdrop-blur-sm text-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700">
            <Database className="w-3 h-3" />
            {fileFormat.toUpperCase()} format
          </div>
        )}

        {proteinData && !isLoading && !error && (
          <div className="absolute top-3 left-3 bg-slate-800/90 backdrop-blur-sm text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700">
            AlphaFold Model v{proteinData.latestVersion}
          </div>
        )}

        {/* Quick Edit Button Overlay */}
        {proteinData?.cifUrl && !isLoading && !error && (
          <div className="absolute top-3 right-3">
            <button
              onClick={openMol3DDashboard}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/80 text-white text-xs rounded hover:bg-blue-600 transition-all duration-200"
              title="Edit in Mol3D Dashboard"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Protein Information Panel with PAE Plot */}
      {proteinData && !error && (
        <div className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-lg border border-slate-700 shadow-xl">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-sm">
            {/* Protein Information - Left Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <Info className="w-4 h-4" />
                <span className="font-semibold text-base">
                  Protein Information
                </span>
              </div>
              <div className="text-slate-200 space-y-2">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Name
                  </span>
                  <span className="font-medium text-slate-100">
                    {proteinData.uniprotDescription}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Gene
                  </span>
                  <span className="text-slate-200">{proteinData.gene}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    UniProt ID
                  </span>
                  <span className="font-mono text-slate-200">
                    {proteinData.uniprotId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    UniProt Accession
                  </span>
                  <span className="font-mono text-slate-200">
                    {proteinData.uniprotAccession}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Organism
                  </span>
                  <span className="italic text-slate-200">
                    {proteinData.organismScientificName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Taxonomy ID
                  </span>
                  <span className="text-slate-200">{proteinData.taxId}</span>
                </div>
              </div>
            </div>

            {/* Structure & Sequence Details - Middle Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <Database className="w-4 h-4" />
                <span className="font-semibold text-base">
                  Structure & Sequence
                </span>
              </div>
              <div className="text-slate-200 space-y-2">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Entry ID
                  </span>
                  <span className="font-mono text-slate-200">
                    {proteinData.entryId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Sequence Length
                  </span>
                  <span className="text-slate-200">
                    {proteinData.uniprotEnd - proteinData.uniprotStart + 1}{" "}
                    amino acids
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Sequence Range
                  </span>
                  <span className="text-slate-200">
                    {proteinData.uniprotStart} - {proteinData.uniprotEnd}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Sequence Checksum
                  </span>
                  <span className="font-mono text-xs text-slate-300">
                    {proteinData.sequenceChecksum}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Model Version
                  </span>
                  <span className="text-slate-200">
                    v{proteinData.latestVersion}{" "}
                    {proteinData.allVersions && (
                      <span className="text-slate-400 text-xs ml-1">
                        (of {proteinData.allVersions.length} versions)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Model Created:
                  </span>
                  <span className="text-slate-200">
                    {new Date(
                      proteinData.modelCreatedDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400 text-xs uppercase tracking-wide">
                    Sequence Updated:
                  </span>
                  <span className="text-slate-200">
                    {new Date(
                      proteinData.sequenceVersionDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* PAE Plot - Right Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold text-base">
                  Predicted Aligned Error
                </span>
              </div>
              <div className="relative bg-slate-900/50 rounded-lg border border-slate-600 overflow-hidden">
                {isLoadingPAE && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                    <div className="text-center text-slate-300">
                      <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs">Loading PAE plot...</p>
                    </div>
                  </div>
                )}

                {paeImageData ? (
                  <img
                    src={paeImageData}
                    alt="Predicted Aligned Error Plot"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                ) : paeError ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
                    <div className="text-center">
                      <p>📊 PAE plot unavailable</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Image could not be loaded
                      </p>
                    </div>
                  </div>
                ) : !isLoadingPAE ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
                    PAE plot loading...
                  </div>
                ) : null}
              </div>

              {paeImageData && (
                <p className="text-xs text-slate-400">
                  Lower values (blue) indicate higher confidence in the relative
                  positions of residue pairs.
                </p>
              )}
            </div>
          </div>

          {/* Quality & Status Indicators */}
          <div className="mt-4 flex flex-wrap gap-2">
            {proteinData.isReviewed && (
              <div className="inline-flex items-center px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm rounded-lg border border-slate-600">
                <span className="mr-2">✓</span>
                Reviewed Entry
              </div>
            )}
            {proteinData.isReferenceProteome && (
              <div className="inline-flex items-center px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm rounded-lg border border-slate-600">
                <span className="mr-2">🧬</span>
                Reference Proteome
              </div>
            )}
            <div className="inline-flex items-center px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm rounded-lg border border-slate-600">
              <span className="mr-2">📊</span>
              High Confidence Model
            </div>
          </div>
        </div>
      )}

      {/* Sequence Display */}
      {proteinData && !error && proteinData.uniprotSequence && (
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              Amino Acid Sequence ({proteinData.uniprotSequence.length}{" "}
              residues)
            </span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded border border-slate-600 max-h-32 overflow-y-auto">
            <div className="font-mono text-xs text-slate-300 break-all leading-relaxed">
              {proteinData.uniprotSequence
                .match(/.{1,60}/g)
                ?.map((line, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-slate-500 mr-2 inline-block w-8">
                      {index * 60 + 1}
                    </span>
                    {line}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Additional Files Available */}
      {proteinData && !error && (
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              Download Files & Resources
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Structure Files */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
                Structure Files
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={proteinData.pdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
                >
                  <Database className="w-3 h-3" />
                  PDB
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href={proteinData.cifUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
                >
                  <Database className="w-3 h-3" />
                  CIF
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                {proteinData.bcifUrl && (
                  <a
                    href={proteinData.bcifUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
                  >
                    <Database className="w-3 h-3" />
                    BCIF
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            </div>

            {/* Analysis Files */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
                Analysis & Annotations
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={proteinData.paeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
                >
                  <Info className="w-3 h-3" />
                  PAE JSON
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                {proteinData.amAnnotationsUrl && (
                  <a
                    href={proteinData.amAnnotationsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm border border-slate-600 hover:border-slate-500"
                  >
                    <Info className="w-3 h-3" />
                    Mutations
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
