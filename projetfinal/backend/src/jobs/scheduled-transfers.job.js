import { TransferService } from "../services/transfer.service.js";

/**
 * Lance le traitement automatique des transactions programmées.
 *
 * 
 * - démarrer un job récurrent
 * 
 *
 */
export function startScheduledTransfersJob() {
  const INTERVAL_MS = 60 * 1000; // 1 minute

  const run = async () => {
    try {
      const result = await TransferService.processDueScheduledTransactions();

      if (result?.ok) {
        const succes = (result.data || []).filter((item) => item.ok).length;
        const echecs = (result.data || []).filter((item) => !item.ok).length;

        if (succes > 0 || echecs > 0) {
          console.log(
            `[SCHEDULED_TRANSFERS_JOB] succès: ${succes}, échecs: ${echecs}`
          );
        }
      }
    } catch (error) {
      console.error(
        "[SCHEDULED_TRANSFERS_JOB] erreur:",
        error.message
      );
    }
  };

  // Exécution immédiate au démarrage
  run();

  // Exécution périodique ensuite
  setInterval(run, INTERVAL_MS);
}