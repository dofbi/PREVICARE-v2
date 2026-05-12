const DEXCHANGE_BASE_URL = 'https://api-m.dexchange.sn/api/v1';

export interface DexchangeMerchantInitRequest {
  externalTransactionId: string;
  ItemName: string;
  ItemPrice: number;
  customData?: string;
  callBackURL: string;
  successUrl: string;
  failureUrl: string;
  ClientName?: string;
  ClientPhone?: string;
}

export interface DexchangeMerchantInitResponse {
  transactionId: string;
  PaymentUrl: string;
  externalTransactionId: string;
  Status?: string;
}

export interface DexchangeTransactionStatus {
  ServiceName: string;
  ServiceCode: string;
  Amount: number;
  Number: string;
  Status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  Initiated_at: string;
  Completed_at: string | null;
  ExternalTransactionId?: string;
}

export interface DexchangeWebhookPayload {
  id: string;
  externalTransactionId: string;
  transactionType: string;
  AMOUNT: number;
  FEE: number;
  PHONE_NUMBER: string;
  STATUS: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  CUSTOM_DATA: string;
  COMPLETED_AT: string;
}

function getApiKey(): string {
  const key = import.meta.env.DEXCHANGE_API_KEY;
  if (!key) {
    throw new Error('DEXCHANGE_API_KEY is not configured');
  }
  return key;
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.message)) return (d.message as string[]).join(', ');
    if (typeof d.message === 'string') return d.message;
  }
  return 'Erreur lors de la création du lien de paiement';
}

function extractTransactionData(data: unknown): DexchangeMerchantInitResponse | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const candidate =
    (d.transaction && typeof d.transaction === 'object' ? d.transaction as Record<string, unknown> : null) ??
    (d.data && typeof d.data === 'object' ? d.data as Record<string, unknown> : null) ??
    d;

  if (candidate.transactionId || candidate.PaymentUrl) {
    return candidate as unknown as DexchangeMerchantInitResponse;
  }
  return null;
}

export async function initMerchantPayment(
  params: DexchangeMerchantInitRequest
): Promise<DexchangeMerchantInitResponse> {
  const apiKey = getApiKey();

  const response = await fetch(`${DEXCHANGE_BASE_URL}/transaction/merchant/get-link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  console.log('[Dexchange] HTTP status:', response.status, '| response body:', JSON.stringify(data));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  const transactionData = extractTransactionData(data);
  if (!transactionData || !transactionData.PaymentUrl) {
    throw new Error(extractErrorMessage(data) || 'Réponse inattendue : lien de paiement manquant');
  }

  return transactionData;
}

export async function getTransactionStatus(
  transactionId: string
): Promise<{ message: string; transaction: DexchangeTransactionStatus }> {
  const apiKey = getApiKey();

  const response = await fetch(`${DEXCHANGE_BASE_URL}/transaction/merchant/${transactionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Array.isArray((data as Record<string, unknown>).message)
      ? ((data as Record<string, unknown>).message as string[]).join(', ')
      : (data as Record<string, unknown>).message || 'Transaction introuvable';
    throw new Error(String(errorMessage));
  }

  return data as { message: string; transaction: DexchangeTransactionStatus };
}
