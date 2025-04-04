import { useState } from "react";
import BuildFetcher from "./BuildFetcher";
import BuildReport from "./BuildReport";
import PDFGenerator from "./PDFGenerator";

export default function ADO() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-white inline mr-10">
          ADO Builds (Last 24 Hours)
        </h1>

        <BuildFetcher
          setBuilds={setBuilds}
          setLoading={setLoading}
          loading={loading}
        />
      </div>

      <BuildReport builds={builds} loading={loading} />

      <PDFGenerator builds={builds} loading={loading} />
    </div>
  );
}
