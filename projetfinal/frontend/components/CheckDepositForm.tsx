"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckDeposit } from "@/lib/actions/check-deposit.actions";
import { CheckCircle2, ImagePlus, Loader2, QrCode, Wallet } from "lucide-react";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type CheckDepositFormProps = {
  clientId: number;
};

export default function CheckDepositForm({
  clientId,
}: CheckDepositFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const fileError = useMemo(() => {
    if (!selectedFile) return "";

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type.toLowerCase())) {
      return "Format image invalide. Utilise JPG, JPEG, PNG ou WEBP.";
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      return "Image trop lourde. Maximum 5 MB.";
    }

    return "";
  }, [selectedFile]);

  const handleFileChange = (file?: File) => {
    setMessage("");
    setMessageType("idle");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setMessage("");
    setMessageType("idle");

    if (!selectedFile) {
      setMessageType("error");
      return setMessage("Choisis une image du chèque.");
    }

    if (fileError) {
      setMessageType("error");
      return setMessage(fileError);
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessageType("error");
      return setMessage("Montant invalide.");
    }

    if (!qrCode.trim()) {
      setMessageType("error");
      return setMessage("Le QR code est obligatoire.");
    }

    setLoading(true);

    const result = await createCheckDeposit({
      clientId,
      imageName: selectedFile.name,
      imageType: selectedFile.type,
      imageSize: selectedFile.size,
      qrCode: qrCode.trim(),
      amount: numericAmount,
    });

    setLoading(false);

    if (!result.ok) {
      setMessageType("error");
      return setMessage(result.error);
    }

    setMessageType("success");
    setMessage("Dépôt validé. Le montant a été ajouté au compte courant.");
    setSelectedFile(null);
    setPreviewUrl("");
    setAmount("");
    setQrCode("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <ImagePlus className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-18 font-semibold text-gray-900">
              Dépôt de chèque par photo
            </h2>
            <p className="text-14 text-gray-600">
              Téléverse l’image, valide les informations, puis crédite le compte chèque.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-14 font-medium text-gray-700">
              Image du chèque
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-14 text-gray-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-14 font-medium text-gray-700">
              Montant
            </label>
            <div className="flex items-center rounded-xl border border-gray-300 px-4 py-3">
              <span className="mr-2 text-16 font-semibold text-gray-600">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full bg-transparent text-16 text-gray-900 outline-none"
                placeholder="Ex. 1250.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-14 font-medium text-gray-700">
              QR code détecté
            </label>
            <div className="flex items-center rounded-xl border border-gray-300 px-4 py-3">
              <QrCode className="mr-3 h-5 w-5 text-gray-500" />
              <input
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                className="w-full bg-transparent text-14 text-gray-900 outline-none"
                placeholder="Ex. BANKAPP-QR-1250"
              />
            </div>
            <p className="mt-2 text-12 text-gray-500">
              Ici le QR est simulé pour respecter le scrum sans casser l’architecture.
            </p>
          </div>

          {fileError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-14 text-red-700">
              {fileError}
            </p>
          )}

          {message && (
            <p
              className={`rounded-xl px-4 py-3 text-14 ${
                messageType === "success"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-bank-gradient px-5 py-3 text-14 font-semibold text-white disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Valider le dépôt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <Wallet className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="text-18 font-semibold text-gray-900">Aperçu</h3>
            <p className="text-14 text-gray-600">
              Le dépôt sera versé dans le compte courant du client.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Prévisualisation du chèque"
              className="h-[260px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[260px] items-center justify-center px-6 text-center text-14 text-gray-500">
              Aucune image sélectionnée.
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3 text-14 text-gray-700">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Fichier</span>
            <span className="font-medium">{selectedFile?.name || "-"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Format</span>
            <span className="font-medium">{selectedFile?.type || "-"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Montant</span>
            <span className="font-medium">
              {amount ? `$${amount}` : "-"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">QR code</span>
            <span className="font-medium">{qrCode || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}