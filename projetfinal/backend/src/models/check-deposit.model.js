import db from "../config/database.js";

/**
 * DAO pour les dépôts de chèques simulés par photo.
 * Cette couche ne contient que du SQL.
 */
export const CheckDepositDAO = {
  create({
    userId,
    accountId,
    imageName,
    imageType,
    imageSize,
    qrCode,
    amount,
    status = "validated",
  }) {
    return db.run(
      `INSERT INTO check_deposits (
        user_id,
        account_id,
        image_name,
        image_type,
        image_size,
        qr_code,
        amount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      userId,
      accountId,
      imageName,
      imageType,
      imageSize,
      qrCode,
      amount,
      status
    );
  },

  findById(id) {
    return db.get(
      `SELECT
         id,
         user_id,
         account_id,
         image_name,
         image_type,
         image_size,
         qr_code,
         amount,
         status,
         created_at
       FROM check_deposits
       WHERE id = ?`,
      id
    );
  },

  /**
   * Vérifie si un chèque avec ce QR code a déjà été déposé.
   * On s'appuie sur le QR comme identifiant unique simulé du chèque.
   */
  findByQrCode(qrCode) {
    return db.get(
      `SELECT
         id,
         user_id,
         account_id,
         qr_code,
         amount,
         status,
         created_at
       FROM check_deposits
       WHERE qr_code = ?
       LIMIT 1`,
      qrCode
    );
  },
};