"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, FileText, AlertCircle } from "lucide-react";
import { getCertificatesOnce, clearCertificatesCache } from "../api/certificateService";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCertificatesOnce();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCertificates(list);
    } catch {
      setError("Failed to load certificates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getCertificatesOnce();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setCertificates(list);
      } catch {
        if (!cancelled) {
          setError("Failed to load certificates.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = () => {
    clearCertificatesCache();
    loadData();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase().trim();
    return certificates.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [certificates, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCertificates.length / pageSize));

  const paginatedCertificates = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCertificates.slice(start, start + pageSize);
  }, [filteredCertificates, page, pageSize]);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatIssuedDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main
      className="min-h-screen w-full pt-32 pb-24 px-4 md:px-8 lg:px-12 relative overflow-hidden"
      style={{ backgroundColor: "#0a1209" }}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 15%, rgba(197, 164, 126, 0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <p
            className="mb-3 text-xs md:text-sm font-bold tracking-[0.2em] uppercase font-mono"
            style={{ color: "#c5a47e" }}
          >
            UNCOMPROMISED STANDARDS
          </p>
          <h1
            className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5"
            style={{ color: "#f5f5f5" }}
          >
            Certificates of Analysis
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed font-light"
            style={{ color: "rgba(245, 245, 245, 0.8)" }}
          >
            Every batch, tested and on record. Open any certificate to view the full lab report.
          </p>

          {/* Search Input Box */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search certificates by title…"
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white/[0.04] border border-[#c5a47e]/30 text-white placeholder:text-white/40 text-sm outline-none transition focus:border-[#c5a47e] focus:bg-white/[0.07] focus:ring-1 focus:ring-[#c5a47e]"
              />
            </div>
          </div>
        </div>

        {/* Content States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-[#c5a47e]/10 bg-white/[0.02] rounded-2xl p-6 animate-pulse space-y-4"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl" />
                <div className="h-5 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-8 bg-white/5 rounded mt-6" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center border border-[#c5a47e]/20 bg-white/[0.02] rounded-2xl max-w-md mx-auto">
            <AlertCircle size={32} className="mx-auto mb-3" style={{ color: "#c5a47e" }} />
            <p className="text-base font-medium text-white mb-3">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm font-semibold underline hover:opacity-80 transition cursor-pointer"
              style={{ color: "#c5a47e" }}
            >
              Retry
            </button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center border border-[#c5a47e]/15 bg-white/[0.02] rounded-2xl max-w-md mx-auto">
            <FileText size={36} className="mx-auto mb-3 opacity-40" style={{ color: "#c5a47e" }} />
            <p className="text-base font-medium" style={{ color: "rgba(245, 245, 245, 0.8)" }}>
              No certificates published yet.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center border border-[#c5a47e]/15 bg-white/[0.02] rounded-2xl max-w-md mx-auto">
            <p className="text-base font-medium" style={{ color: "rgba(245, 245, 245, 0.8)" }}>
              No certificates match your search.
            </p>
          </div>
        ) : (
          <>
            {/* Certificates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCertificates.map((cert) => (
                <motion.a
                  key={cert.id}
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group flex flex-col justify-between border border-[#c5a47e]/20 bg-white/[0.03] hover:border-[#c5a47e]/60 rounded-2xl p-6 transition duration-300 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#c5a47e]/10 border border-[#c5a47e]/20 flex items-center justify-center text-[#c5a47e]">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-[#c5a47e]/30 text-[#c5a47e] bg-[#c5a47e]/5">
                        PDF
                      </span>
                    </div>

                    <h2 className="font-serif text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-[#c5a47e] transition-colors">
                      {cert.title}
                    </h2>

                    {cert.issued_on && (
                      <p
                        className="mt-2 text-xs font-medium"
                        style={{ color: "rgba(245, 245, 245, 0.6)" }}
                      >
                        Issued {formatIssuedDate(cert.issued_on)}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: "rgba(245, 245, 245, 0.45)" }}
                    >
                      {formatFileSize(cert.file_size_bytes)}
                    </span>
                    <span
                      className="font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      style={{ color: "#c5a47e" }}
                    >
                      View PDF ↗
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Pagination Controls (only when more than 24) */}
            {filteredCertificates.length > pageSize && (
              <div
                className="flex items-center justify-center gap-6 mt-12 text-sm font-semibold"
                style={{ color: "#c5a47e" }}
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="disabled:opacity-30 disabled:cursor-not-allowed hover:underline transition cursor-pointer"
                >
                  ‹ Prev
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="disabled:opacity-30 disabled:cursor-not-allowed hover:underline transition cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
