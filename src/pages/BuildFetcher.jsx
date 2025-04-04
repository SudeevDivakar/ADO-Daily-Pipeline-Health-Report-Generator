import axios from "axios";

export default function BuildFetcher({ setBuilds, setLoading, loading }) {
  const fetchBuilds = async () => {
    setLoading(true);

    const organization = ""; // Put your ADO organization here
    const project = ""; // Put your ADO project here
    const pat = ""; // Put your ADO personal access token here

    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds?queryOrder=finishTimeDescending&api-version=7.0`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${btoa(":" + pat)}` },
      });

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentBuilds = response.data.value.filter(
        (build) => new Date(build.finishTime) >= last24Hours
      );

      setBuilds(recentBuilds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="bg-green-400 text-white px-4 py-2 rounded-md mb-4 hover:bg-green-500 transition-all hover:scale-105"
      onClick={fetchBuilds}
      disabled={loading}
    >
      {loading ? "Loading..." : "Fetch Builds"}
    </button>
  );
}
