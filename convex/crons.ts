import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily("payment reminders", { hourUTC: 6, minuteUTC: 0 }, internal.jobs.sendPaymentReminders);
crons.daily("overdue support scan", { hourUTC: 7, minuteUTC: 0 }, internal.jobs.runOverdueSupportScan);
crons.daily("notification retry scan", { hourUTC: 8, minuteUTC: 0 }, internal.jobs.retryFailedNotifications);

export default crons;
