import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import PipelineCharts from "./PipelineCharts";

export default function PDFGenerator({ builds, loading }) {
  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "America/Indiana/Indianapolis",
    });

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

    for (const [pipelineName, pipelineBuilds] of Object.entries(
      buildsByPipeline
    )) {
      // Always add a new page per pipeline for consistent spacing
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text("Build Details by Pipeline", 14, 20);
      addBuildTable(pdf, pipelineName, pipelineBuilds);
    }

    for (const [pipelineName, pipelineBuilds] of Object.entries(
      buildsByPipeline
    )) {
      await addPipelineChartsToPDF(pdf, pipelineName, pipelineBuilds);
    }

    // Section 3: Aggregate
    pdf.addPage();
    pdf.setFontSize(18);
    pdf.text("Aggregate Analytics (All Pipelines)", 14, 20);
    await addChartsToPDF(pdf, builds, "All Pipelines");

    // Save
    pdf.save(`ADO_Builds_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const addBuildTable = (pdf, pipelineName, builds) => {
    const startY = 30; // consistent Y for heading
    pdf.setFontSize(14);
    pdf.text(`Pipeline: ${pipelineName}`, 14, startY);

    const columns = [
      "Build #",
      "Status",
      "Result",
      "Reason",
      "Priority",
      "Queue Time",
      "Start Time",
      "Finish Time",
      "Repository",
      "Requested By",
      "PR Sender",
      "PR Title",
    ];

    const rows = builds.map((build) => [
      build.buildNumber,
      build.status,
      build.result || "N/A",
      build.reason || "N/A",
      build.priority || "Normal",
      build.queueTime
        ? new Date(build.queueTime).toLocaleString("en-US", {
            timeZone: "America/Indiana/Indianapolis",
          })
        : "N/A",
      build.startTime
        ? new Date(build.startTime).toLocaleString("en-US", {
            timeZone: "America/Indiana/Indianapolis",
          })
        : "N/A",
      build.finishTime
        ? new Date(build.finishTime).toLocaleString("en-US", {
            timeZone: "America/Indiana/Indianapolis",
          })
        : "N/A",
      build.repository?.type || "N/A",
      build.requestedBy?.displayName || "N/A",
      build.triggerInfo?.["pr.sender.name"] || "N/A",
      build.triggerInfo?.["pr.title"] || "N/A",
    ]);

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
      didDrawPage: (data) => {
        const pageCount = pdf.internal.getNumberOfPages();
        pdf.setFontSize(10);
        pdf.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          pdf.internal.pageSize.height - 10
        );
      },
    });
  };

  const addPipelineChartsToPDF = async (pdf, pipelineName, builds) => {
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text(`Pipeline: ${pipelineName}`, 14, 20);
    await addChartsToPDF(pdf, builds, pipelineName);
  };

  const addChartsToPDF = async (pdf, builds, title) => {
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "800px";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-10000px";
    tempDiv.style.backgroundColor = "white";
    document.body.appendChild(tempDiv);

    const root = createRoot(tempDiv);
    root.render(
      <div style={{ padding: "20px", backgroundColor: "white" }}>
        <PipelineCharts pipelineBuilds={builds} />
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    document.body.removeChild(tempDiv);
    root.unmount();

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Draw image at consistent position
    const imageStartY = 15;
    pdf.addImage(imgData, "PNG", 10, imageStartY, pdfWidth, pdfHeight);
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
