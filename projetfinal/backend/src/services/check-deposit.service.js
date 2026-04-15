import db from "../config/database.js";
import { AccountDAO } from "../models/bank.model.js";
import { TransactionDAO } from "../models/transaction.model.js";
import { CheckDepositDAO } from "../models/check-deposit.model.js";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Extrait le montant encodé dans un QR simulé.
 *
 * Formats acceptés :
 * - BANKAPP-QR-1250
 * - BANKAPP-QR-1250.00
 */
function extractAmountFromQrCode(qrCode) {
  const match = String(qrCode).match(/^BANKAPP-QR-(\d+(?:\.\d{1,2})?)$/i);

  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export const CheckDepositService = {
  async createCheckDeposit({
    clientId,
    imageName,
    imageType,
    imageSize,
    qrCode,
    amount,
  }) {
    const safeImageName = String(imageName ?? "").trim();
    const safeImageType = String(imageType ?? "").trim().toLowerCase();
    const safeQrCode = String(qrCode ?? "").trim();
    const numericImageSize = Number(imageSize);
    const numericAmount = Number(amount);

    if (!safeImageName || !safeImageType) {
      return {
        ok: false,
        status: 400,
        error: "Image du chèque obligatoire.",
      };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(safeImageType)) {
      return {
        ok: false,
        status: 400,
        error: "Format image invalide. Utilise JPG, JPEG, PNG ou WEBP.",
      };
    }

    if (!Number.isFinite(numericImageSize) || numericImageSize <= 0) {
      return {
        ok: false,
        status: 400,
        error: "Taille de l'image invalide.",
      };
    }

    if (numericImageSize > MAX_IMAGE_SIZE) {
      return {
        ok: false,
        status: 400,
        error: "Image trop lourde. Maximum 5 MB.",
      };
    }

    if (!safeQrCode) {
      return {
        ok: false,
        status: 400,
        error: "QR code non détecté ou invalide.",
      };
    }

    // Vérification format QR
    const qrAmount = extractAmountFromQrCode(safeQrCode);

    if (qrAmount === null) {
      return {
        ok: false,
        status: 400,
        error: "Format du QR code invalide. Exemple : BANKAPP-QR-120",
      };
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        ok: false,
        status: 400,
        error: "Montant invalide.",
      };
    }

    // Vérification cohérence montant ↔ QR
    if (Number(qrAmount.toFixed(2)) !== Number(numericAmount.toFixed(2))) {
      return {
        ok: false,
        status: 400,
        error: "Le montant saisi ne correspond pas au QR code du chèque.",
      };
    }

    const checkingAccount = await AccountDAO.findCheckingByClientId(clientId);

    if (!checkingAccount) {
      return {
        ok: false,
        status: 404,
        error: "Compte courant (chèque) introuvable pour ce client.",
      };
    }

    await db.exec("BEGIN");

    try {
      const createdDeposit = await CheckDepositDAO.create({
        userId: clientId,
        accountId: checkingAccount.id,
        imageName: safeImageName,
        imageType: safeImageType,
        imageSize: numericImageSize,
        qrCode: safeQrCode,
        amount: numericAmount,
        status: "validated",
      });

      const newBalance = Number(checkingAccount.balance) + numericAmount;

      await AccountDAO.updateBalance(checkingAccount.id, newBalance);

      const transaction = await TransactionDAO.create({
        accountId: checkingAccount.id,
        type: "CREDIT",
        amount: numericAmount,
        description: `Dépôt de chèque par photo • QR ${safeQrCode}`,
      });

      await db.exec("COMMIT");

      const deposit = await CheckDepositDAO.findById(createdDeposit.lastID);

      return {
        ok: true,
        status: 201,
        data: {
          message: "Dépôt de chèque effectué avec succès.",
          deposit,
          transaction,
          account: {
            ...checkingAccount,
            balance: newBalance,
          },
        },
      };
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  },
};