export default function BuildPipeline({ pipelineName, pipelineBuilds }) {
  return (
    <>
      <h2 className="text-xl font-bold text-white mb-4">{pipelineName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelineBuilds.map((build) => (
          <a
            href={build._links.web.href}
            target="_blank"
            rel="noreferrer"
            key={build.id}
          >
            <div className="bg-gray-200 p-4 rounded-md shadow-md hover:scale-105 transition-all">
              <h1 className="font-semibold">
                Build Number: {build.buildNumber}
              </h1>
              <p>Status: {build.status}</p>
              <p>Result: {build.result || "N/A"}</p>
              <p>Reason: {build.reason || "N/A"}</p>
              <p>Priority: {build.priority || "Normal"}</p>
              <p>
                Queue Time:{" "}
                {build.queueTime
                  ? new Date(build.queueTime).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                Start Time:{" "}
                {build.startTime
                  ? new Date(build.startTime).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                Finish Time:{" "}
                {build.finishTime
                  ? new Date(build.finishTime).toLocaleString()
                  : "N/A"}
              </p>
              <p>Repository: {build.repository?.type || "N/A"}</p>
              <p>Requested By: {build.requestedBy?.displayName || "N/A"}</p>
              {build.triggerInfo?.["pr.sender.name"] && (
                <>
                  <p>PR Sender: {build.triggerInfo["pr.sender.name"]}</p>
                  <p>PR Title: {build.triggerInfo["pr.title"]}</p>
                </>
              )}
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
