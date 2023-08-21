import { getHealthCheck, HealthCheckRow } from "@/tioga_db";

function healthCheckRecent(healthCheck: HealthCheckRow) {
  const now = new Date();
  const lastCheck = new Date(healthCheck.ts * 1000);
  const diff__s = (now.getTime() - lastCheck.getTime()) / 1000;
  const TWO_HOURS = 2 * 60 * 60;
  return diff__s < TWO_HOURS;
}

export default function History({
  healthCheck,
}: {
  healthCheck: HealthCheckRow;
}) {
  const isRecent = healthCheckRecent(healthCheck);
  const isHealthy = isRecent && healthCheck.status === "OK";

  return (
    <main>
      <div className="flex justify-center mx-4 my-2">
        Health check: {isHealthy ? "PASS" : "FAIL"}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  const healthCheck = await getHealthCheck();
  return {
    props: {
      healthCheck,
    },
  };
}
