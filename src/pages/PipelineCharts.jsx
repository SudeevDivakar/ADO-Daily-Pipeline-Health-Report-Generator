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
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#FF6B6B",
  "#4ECDC4",
];

export default function PipelineCharts({ pipelineBuilds }) {
  // Process data for charts
  const statusData = processData(pipelineBuilds, "status");
  const resultData = processData(pipelineBuilds, "result", "Unknown");
  const reasonData = processData(pipelineBuilds, "reason", "Unknown");
  const priorityData = processData(pipelineBuilds, "priority", "Normal");
  const repoTypeData = processData(
    pipelineBuilds,
    "repository.type",
    "Unknown"
  );
  const requestedByData = processData(
    pipelineBuilds,
    "requestedBy.displayName",
    "Unknown"
  );

  const prData = pipelineBuilds
    .filter(
      (build) =>
        build.requestedBy?.displayName === "GitHub" &&
        build.triggerInfo?.["pr.sender.name"]
    )
    .map((build) => ({
      sender: build.triggerInfo["pr.sender.name"],
      title: build.triggerInfo["pr.title"],
      result: build.result,
      status: build.status,
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <ChartCard title="Total Builds">
        <BarChart data={[{ name: "Total", count: pipelineBuilds.length }]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#0088FE" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Build Results">
        <PieChart>
          <Pie
            data={resultData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {resultData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ChartCard>

      <ChartCard title="Build Status">
        <PieChart>
          <Pie
            data={statusData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {statusData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ChartCard>

      <ChartCard title="Build Reasons">
        <BarChart data={reasonData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Build Priorities">
        <BarChart data={priorityData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Repository Types">
        <PieChart>
          <Pie
            data={repoTypeData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {repoTypeData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ChartCard>

      <ChartCard title="Requested By">
        <BarChart data={requestedByData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#FF6B6B" />
        </BarChart>
      </ChartCard>

      {prData.length > 0 && (
        <ChartCard title="PR Build Results">
          <BarChart data={prData}>
            <XAxis dataKey="sender" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="result" fill="#4ECDC4" />
          </BarChart>
        </ChartCard>
      )}
    </div>
  );
}

function processData(builds, property, defaultValue = undefined) {
  return Object.values(
    builds.reduce((acc, build) => {
      let value;
      if (property.includes(".")) {
        value = property.split(".").reduce((obj, key) => obj?.[key], build);
      } else {
        value = build[property];
      }
      value = value || defaultValue;

      acc[value] = acc[value] || { name: value, count: 0 };
      acc[value].count++;
      return acc;
    }, {})
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
