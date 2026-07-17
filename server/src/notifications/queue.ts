import { supabaseAdmin } from "../db/supabase";
import { logger } from "../logger";

export type NotificationJob = {
  id: string;
  lead_id: string;
  event_id: string;
  channel: "email" | "webhook";
  status: "pending" | "processing" | "sent" | "failed" | "skipped";
  attempts: number;
  next_attempt_at: string;
  locked_at: string | null;
  last_error: string | null;
  response_status: number | null;
  provider_message_id: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
};

/** Backoff: 0s, 1m, 5m, 15m, 1h, 6h, 24h, 48h. Depois desiste. */
export const BACKOFF_MS = [
  0,
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  24 * 60 * 60_000,
  48 * 60 * 60_000,
];
export const MAX_ATTEMPTS = BACKOFF_MS.length;

export async function enqueue(job: {
  lead_id: string;
  event_id: string;
  channel: "email" | "webhook";
  status?: "pending" | "skipped";
}) {
  const { error } = await supabaseAdmin
    .from("lead_notification_jobs")
    .upsert(
      {
        lead_id: job.lead_id,
        event_id: job.event_id,
        channel: job.channel,
        status: job.status ?? "pending",
        next_attempt_at: new Date().toISOString(),
      },
      { onConflict: "lead_id,channel", ignoreDuplicates: true }
    );
  if (error) {
    logger.error({ err: error, job }, "enqueue_failed");
    throw error;
  }
}

export async function claimJobs(limit: number): Promise<NotificationJob[]> {
  const { data, error } = await supabaseAdmin.rpc("claim_notification_jobs", {
    _limit: limit,
  });
  if (error) {
    logger.error({ err: error }, "claim_jobs_failed");
    return [];
  }
  return (data ?? []) as NotificationJob[];
}

export async function markSent(
  jobId: string,
  extras: { provider_message_id?: string | null; response_status?: number | null } = {}
) {
  await supabaseAdmin
    .from("lead_notification_jobs")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      locked_at: null,
      last_error: null,
      provider_message_id: extras.provider_message_id ?? null,
      response_status: extras.response_status ?? null,
    })
    .eq("id", jobId);
}

export async function markRetryOrFail(job: NotificationJob, error: string, responseStatus?: number) {
  const nextIdx = job.attempts; // já foi incrementado no claim
  if (nextIdx >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from("lead_notification_jobs")
      .update({
        status: "failed",
        locked_at: null,
        last_error: error.slice(0, 2000),
        response_status: responseStatus ?? null,
      })
      .eq("id", job.id);
    logger.error(
      { job_id: job.id, channel: job.channel, attempts: job.attempts },
      "notification_failed_permanently"
    );
    return;
  }
  const delay = BACKOFF_MS[nextIdx];
  const nextAttemptAt = new Date(Date.now() + delay).toISOString();
  await supabaseAdmin
    .from("lead_notification_jobs")
    .update({
      status: "pending",
      next_attempt_at: nextAttemptAt,
      locked_at: null,
      last_error: error.slice(0, 2000),
      response_status: responseStatus ?? null,
    })
    .eq("id", job.id);
}

export async function updateLeadStatus(
  leadId: string,
  patch: { email_status?: string; webhook_status?: string; status?: string }
) {
  await supabaseAdmin.from("contatos").update(patch).eq("id", leadId);
}
