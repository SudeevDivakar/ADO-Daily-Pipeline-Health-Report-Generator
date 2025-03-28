import { useState, useRef } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export default function ADO() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const fetchBuilds = async () => {
    setLoading(true);

    const organization = ""; // Put your ADO organization here
    const project = ""; // Put your ADO project here
    const pat = ""; // Put your ADO personal access token here (with Build read access)

    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds?queryOrder=finishTimeDescending&api-version=7.0`;

    const config = {
      headers: {
        Authorization: `Basic ${btoa(":" + pat)}`,
      },
    };

    try {
      const response = await axios.get(url, config);
      const buildsData = response.data.value;

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentBuilds = buildsData.filter((build) => {
        const finishTime = new Date(build.finishTime);
        return finishTime >= last24Hours;
      });

      setBuilds(recentBuilds);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const createPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");

    // Define table columns and rows
    const columns = [
      "Build Number",
      "Pipeline",
      "Status",
      "Result",
      "Finish Time",
    ];
    const rows = builds.map((build) => [
      build.buildNumber,
      build.definition.name,
      build.status,
      build.result,
      new Date(build.finishTime).toLocaleString(),
    ]);

    // Add title
    pdf.text("ADO Builds Report (Last 24 Hours)", 10, 10);

    // Add table using autoTable
    autoTable(pdf, {
      head: [columns],
      body: rows,
      startY: 20,
      styles: { fontSize: 10 },
    });

    const finalY = pdf.lastAutoTable.finalY || 20;
    try {
      if (reportRef.current) {
        // Capture the entire report section
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, finalY + 10, pdfWidth, pdfHeight);
        pdf.save("ADO_Builds_Report.pdf");
      }
    } catch (error) {
      console.error("Error capturing charts: ", error);
    }
  };

  const pipelineData = Object.values(
    builds.reduce((acc, build) => {
      acc[build.definition.name] = acc[build.definition.name] || {
        name: build.definition.name,
        count: 0,
      };
      acc[build.definition.name].count++;
      return acc;
    }, {})
  );

  const statusData = Object.values(
    builds.reduce((acc, build) => {
      acc[build.status] = acc[build.status] || { name: build.status, count: 0 };
      acc[build.status].count++;
      return acc;
    }, {})
  );

  const resultData = Object.values(
    builds.reduce((acc, build) => {
      acc[build.result] = acc[build.result] || { name: build.result, count: 0 };
      acc[build.result].count++;
      return acc;
    }, {})
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-white inline mr-10">
          ADO Builds (Last 24 Hours)
        </h1>

        <button
          className="bg-green-400 text-white px-4 py-2 rounded-md mb-4 hover:bg-green-500 transition-all hover:scale-105"
          onClick={fetchBuilds}
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch Builds"}
        </button>
      </div>

      {builds.length === 0 && !loading && (
        <p className="text-white text-center">No builds found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {builds.map((build) => (
          <a href={build._links.web.href} target="_blank" key={build.id}>
            <div className="bg-gray-200 p-4 rounded-md shadow-md hover:scale-105 transition-all">
              <h1 className="font-semibold">
                Build Number: {build.buildNumber}
              </h1>
              <p>Pipeline: {build.definition.name}</p>
              <p>Status: {build.status}</p>
              <p>Result: {build.result}</p>
              <p>Finished: {new Date(build.finishTime).toLocaleString()}</p>
            </div>
          </a>
        ))}
      </div>
      <div ref={reportRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Pipelines</h2>
            <PieChart width={300} height={300}>
              <Pie
                data={pipelineData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {pipelineData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <BarChart width={300} height={300} data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Result</h2>
            <BarChart width={300} height={300} data={resultData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </div>
        </div>
      </div>

      <div className="w-full text-center mt-10">
        {builds.length > 0 && !loading && (
          <button
            onClick={createPDF}
            className="bg-green-400 text-white px-4 py-2 rounded-md mb-4 hover:bg-green-500 transition-all hover:scale-105"
          >
            Create PDF
          </button>
        )}
      </div>
    </div>
  );
}
