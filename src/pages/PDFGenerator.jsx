import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import PipelineCharts from "./PipelineCharts";

export default function PDFGenerator({ builds, loading }) {
  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const currentDate = new Date().toLocaleString();

    // Cover Page
    pdf.setFontSize(24);
    pdf.text("ADO BUILDS REPORT", 105, 100, { align: "center" });
    pdf.setFontSize(18);
    pdf.text("(Last 24 hours)", 105, 115, { align: "center" });
    pdf.setFontSize(14);
    pdf.text(`Time of report: ${currentDate}`, 105, 130, { align: "center" });

    // Group builds by pipeline
    const buildsByPipeline = builds.reduce((acc, build) => {
      const pipelineName = build.definition.name;
      if (!acc[pipelineName]) acc[pipelineName] = [];
      acc[pipelineName].push(build);
      return acc;
    }, {});

    pdf.addPage();

    let finalY = 20;

    for (const [pipelineName, pipelineBuilds] of Object.entries(
      buildsByPipeline
    )) {
      // Always add a new page per pipeline for consistent spacing
      // pdf.addPage();
      pdf.setFontSize(18);
      pdf.text("Build Details by Pipeline", 14, 20);

      addBuildTable(pdf, pipelineName, pipelineBuilds, finalY);

      finalY = pdf.lastAutoTable.finalY;
    }

    pdf.addPage();

    // Compute Summary
    const totalBuilds = builds.length;
    const successfulBuilds = builds.filter(
      (build) => build.result === "succeeded"
    ).length;
    const failedBuilds = builds.filter(
      (build) => build.result === "failed"
    ).length;

    pdf.setFontSize(16);
    pdf.text("Build Summary", 14, 20);
    pdf.setFontSize(12);
    pdf.text(`Total Builds: ${totalBuilds}`, 14, 30);
    pdf.text(`Successful Builds: ${successfulBuilds}`, 14, 40);
    pdf.text(`Failed Builds: ${failedBuilds}`, 14, 50);

    // Save
    pdf.save(`ADO_Builds_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const addBuildTable = (pdf, pipelineName, builds, startY) => {
    startY += 15;
    pdf.setFontSize(14);
    pdf.text(`Pipeline: ${pipelineName}`, 14, startY);

    const columns = [
      "Build #",
      "Status",
      "Result",
      "Priority",
      "Queue Time",
      "Start Time",
      "Finish Time",
      "Reason",
      "Requested By",
      "PR Sender",
      "Build Time",
      "Queued Duration",
    ];

    const rows = builds.map((build) => {
      const queueTime = build.queueTime ? new Date(build.queueTime) : null;
      const startTime = build.startTime ? new Date(build.startTime) : null;
      const finishTime = build.finishTime ? new Date(build.finishTime) : null;

      const buildDuration =
        startTime && finishTime
          ? formatDuration(finishTime - startTime)
          : "N/A";

      const queueDuration =
        queueTime && startTime ? formatDuration(startTime - queueTime) : "N/A";

      return [
        build.buildNumber,
        build.status,
        build.result || "N/A",
        build.priority || "Normal",
        queueTime ? queueTime.toLocaleString() : "N/A",
        startTime ? startTime.toLocaleString() : "N/A",
        finishTime ? finishTime.toLocaleString() : "N/A",
        build.reason || "N/A",
        build.requestedBy?.displayName || "N/A",
        build.triggerInfo?.["pr.sender.name"] || "N/A",
        buildDuration,
        queueDuration,
      ];
    });

    autoTable(pdf, {
      head: [columns],
      body: rows,
      startY: startY + 8,
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: "linebreak",
        minCellHeight: 5,
      },
      margin: { horizontal: 2 },
      tableWidth: "wrap",
    });
  };

  return builds.length > 0 && !loading ? (
    <div className="w-full text-center mt-10">
      <button
        onClick={generatePDF}
        className="bg-green-400 text-white px-4 py-2 rounded-md mb-4 hover:bg-green-500 transition-all hover:scale-105"
      >
        Generate Comprehensive PDF Report
      </button>
    </div>
  ) : null;
}
