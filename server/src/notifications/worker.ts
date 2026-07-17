import { logger } from "../logger";
import { claimJobs, markRetryOrFail, markSent, updateLeadStatus } from "./queue";
import { sendLeadNotificationEmail } from "./email";
import { sendLeadWebhook } from "./webhook";

const TICK_MS = 10_000; // 10s
const BATCH = 5;

let running = false;
let stopped = false;

async function processOne(job: Awaited<ReturnType<typeof claimJobs>>[number]) {
  try {
    if (job.channel === "email") {
      const result = await sendLeadNotificationEmail(job.lead_id);
      if (result.skipped) {
        // Sem RESEND configurado: devolve para pending com backoff longo até o admin configurar
        await markRetryOrFail(job, `skipped: ${result.skipped}`);
        return;
      }
      await markSent(job.id, { provider_message_id: result.id, response_status: 200 });
      await updateLeadStatus(job.lead_id, { email_status: "sent" });
    } else if (job.channel === "webhook") {
      const result = await sendLeadWebhook(job.lead_id);
      if (result.skipped) {
        await markRetryOrFail(job, `skipped: ${result.skipped}`);
        return;
      }
      await markSent(job.id, { response_status: result.status });
      await updateLeadStatus(job.lead_id, { webhook_status: "sent" });
    }
    logger.info(
      { event: "notification_sent", job_id: job.id, channel: job.channel, lead_id: job.lead_id, attempts: job.attempts },
      "sent"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markRetryOrFail(job, msg);
    logger.warn(
      { event: "notification_retry", job_id: job.id, channel: job.channel, lead_id: job.lead_id, attempts: job.attempts, error: msg },
      "retry"
    );
  }
}

async function tick() {
  if (running || stopped) return;
  running = true;
  try {
    const jobs = await claimJobs(BATCH);
    if (jobs.length > 0) {
      await Promise.all(jobs.map(processOne));
    }
  } catch (err) {
    logger.error({ err }, "worker_tick_failed");
  } finally {
    running = false;
  }
}

export function startWorker() {
  logger.info({ tick_ms: TICK_MS, batch: BATCH }, "notification_worker_started");
  const interval = setInterval(() => {
    void tick();
  }, TICK_MS);
  // primeiro tick logo após o boot
  setTimeout(() => void tick(), 1000);
  const shutdown = () => {
    stopped = true;
    clearInterval(interval);
    logger.info("notification_worker_stopped");
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
