import BuildPipeline from "./BuildPipeline";
import PipelineCharts from "./PipelineCharts";

export default function BuildReport({ builds, loading }) {
  if (builds.length === 0 && !loading) {
    return <p className="text-white text-center">No builds found.</p>;
  }

  // Group builds by pipeline
  const buildsByPipeline = builds.reduce((acc, build) => {
    const pipelineName = build.definition.name;
    if (!acc[pipelineName]) acc[pipelineName] = [];
    acc[pipelineName].push(build);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(buildsByPipeline).map(
        ([pipelineName, pipelineBuilds]) => (
          <div key={pipelineName} className="mb-8">
            <BuildPipeline
              pipelineName={pipelineName}
              pipelineBuilds={pipelineBuilds}
            />
            <PipelineCharts pipelineBuilds={pipelineBuilds} />
          </div>
        )
      )}

      {builds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Aggregate Report (All Pipelines)
          </h2>
          <PipelineCharts pipelineBuilds={builds} />
        </div>
      )}
    </>
  );
}
