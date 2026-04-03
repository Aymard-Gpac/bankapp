/**
 * DAO (Data Access Object) pour les transactions programmées
 * @module models/scheduled-transaction.model
 */

import db from "../config/database.js";

/**
 * ScheduledTransactionDAO
 *
 * Cette couche parle DIRECTEMENT à la base de données.
 * Elle expose des méthodes CRUD spécifiques aux transactions programmées.
 */
export const ScheduledTransactionDAO = {
  /**
   * Créer une transaction programmée
   * @param {Object} data
   */
  create(data) {
    return db.run(
      `INSERT INTO scheduled_transactions (
        user_id,
        kind,
        from_account_id,
        to_account_id,
        beneficiary_id,
        recipient_email,
        recipient_first_name,
        recipient_last_name,
        is_external_recipient,
        amount,
        frequency,
        next_run_date,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.userId,
      data.kind,
      data.fromAccountId,
      data.toAccountId ?? null,
      data.beneficiaryId ?? null,
      data.recipientEmail ?? null,
      data.recipientFirstName ?? null,
      data.recipientLastName ?? null,
      data.isExternalRecipient ? 1 : 0,
      data.amount,
      data.frequency,
      data.nextRunDate,
      data.description ?? null,
      data.status ?? "active"
    );
  },

  /**
   * Trouver une transaction programmée par ID
   */
  findById(id) {
    return db.get(`SELECT * FROM scheduled_transactions WHERE id = ?`, id);
  },

  /**
   * Récupère toutes les transactions programmées d’un utilisateur
   */
  findByUserId(userId) {
    return db.all(
      `
      SELECT
        st.*,
        st.recipient_first_name,
        st.recipient_last_name,

        /*
         * Nom calculé du destinataire Interac.
         *
         * Priorité :
         * 1) prénom/nom stockés directement dans scheduled_transactions
         * 2) prénom/nom retrouvés via la table users grâce à recipient_email
         * 3) null (le frontend retombera sur l'email)
         *
         * Cela permet de corriger aussi les anciennes transactions
         * qui n'avaient pas enregistré recipient_first_name / recipient_last_name.
         */
        CASE
          WHEN TRIM(
            COALESCE(st.recipient_first_name, '') || ' ' || COALESCE(st.recipient_last_name, '')
          ) <> ''
            THEN TRIM(
              COALESCE(st.recipient_first_name, '') || ' ' || COALESCE(st.recipient_last_name, '')
            )
          WHEN TRIM(
            COALESCE(recipient_user.first_name, '') || ' ' || COALESCE(recipient_user.last_name, '')
          ) <> ''
            THEN TRIM(
              COALESCE(recipient_user.first_name, '') || ' ' || COALESCE(recipient_user.last_name, '')
            )
          ELSE NULL
        END AS interac_recipient_name,

        /*
         * Normalise le libellé du compte source pour supporter
         * les deux formats déjà présents dans le projet :
         * - nouveaux comptes : cheque / epargne / credit
         * - anciens comptes seedés : Compte Cheque / Compte Epargne / Compte Credit
         */
        CASE
          WHEN REPLACE(LOWER(TRIM(COALESCE(source_account.type, ''))), 'é', 'e') LIKE '%cheque%'
            THEN 'Compte Chèque'
          WHEN REPLACE(LOWER(TRIM(COALESCE(source_account.type, ''))), 'é', 'e') LIKE '%epargne%'
            THEN 'Compte Épargne'
          WHEN REPLACE(LOWER(TRIM(COALESCE(source_account.type, ''))), 'é', 'e') LIKE '%credit%'
            THEN 'Compte Crédit'
          ELSE NULL
        END AS source_account_name,

        /*
         * Même normalisation pour le compte de destination
         * afin que les transactions futures internes affichent
         * correctement : chèque / épargne / crédit.
         */
        CASE
          WHEN REPLACE(LOWER(TRIM(COALESCE(destination_account.type, ''))), 'é', 'e') LIKE '%cheque%'
            THEN 'Compte Chèque'
          WHEN REPLACE(LOWER(TRIM(COALESCE(destination_account.type, ''))), 'é', 'e') LIKE '%epargne%'
            THEN 'Compte Épargne'
          WHEN REPLACE(LOWER(TRIM(COALESCE(destination_account.type, ''))), 'é', 'e') LIKE '%credit%'
            THEN 'Compte Crédit'
          ELSE NULL
        END AS destination_account_name,

        beneficiary.name AS beneficiary_name

      FROM scheduled_transactions st
      LEFT JOIN accounts AS source_account
        ON st.from_account_id = source_account.id
      LEFT JOIN accounts AS destination_account
        ON st.to_account_id = destination_account.id
      LEFT JOIN beneficiaries AS beneficiary
        ON st.beneficiary_id = beneficiary.id
      LEFT JOIN users AS recipient_user
        ON LOWER(TRIM(recipient_user.email)) = LOWER(TRIM(st.recipient_email))
      WHERE st.user_id = ?
      ORDER BY st.next_run_date ASC
      `,
      [userId]
    );
  },

  /**
   * Récupérer les transactions à exécuter (échéance atteinte)
   */
  findDueActive(date) {
    return db.all(
      `SELECT * FROM scheduled_transactions
       WHERE status = 'active'
       AND next_run_date <= ?`,
      date
    );
  },

  /**
   * Mettre à jour la prochaine exécution
   */
  markRun(id, nextRunDate) {
    return db.run(
      `UPDATE scheduled_transactions
       SET last_run_at = CURRENT_TIMESTAMP,
           next_run_date = ?
       WHERE id = ?`,
      nextRunDate,
      id
    );
  },

  /**
   * Annuler une transaction programmée
   */
  cancel(id, userId) {
    return db.run(
      `UPDATE scheduled_transactions
       SET status = 'cancelled'
       WHERE id = ? AND user_id = ?`,
      id,
      userId
    );
  },
};