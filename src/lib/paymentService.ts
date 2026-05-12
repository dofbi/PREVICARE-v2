import type { PaymentMethodType } from '../types/payments';

export interface PaymentRequest {
  amount: number;
  method: PaymentMethodType;
  phoneNumber?: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  reference: string;
  message: string;
  transactionId?: string;
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  if (request.method === 'mock') {
    return {
      success: true,
      reference,
      message: 'Paiement de test effectué avec succès',
      transactionId: `MOCK-${Date.now()}`,
    };
  }

  if (request.method === 'om') {
    if (!request.phoneNumber) {
      return {
        success: false,
        reference: '',
        message: 'Numéro Orange Money requis',
      };
    }
    return {
      success: true,
      reference,
      message: `Paiement Orange Money de ${request.amount} FCFA initié. Confirmez sur votre téléphone.`,
      transactionId: `OM-${Date.now()}`,
    };
  }

  if (request.method === 'wave') {
    if (!request.phoneNumber) {
      return {
        success: false,
        reference: '',
        message: 'Numéro Wave requis',
      };
    }
    return {
      success: true,
      reference,
      message: `Paiement Wave de ${request.amount} FCFA initié. Confirmez sur votre application Wave.`,
      transactionId: `WAVE-${Date.now()}`,
    };
  }

  return {
    success: true,
    reference,
    message: 'Paiement effectué avec succès',
    transactionId: `CARD-${Date.now()}`,
  };
}

export async function verifyPayment(reference: string): Promise<{ verified: boolean; status: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    verified: true,
    status: 'completed',
  };
}

export async function refundPayment(reference: string, amount: number): Promise<PaymentResult> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    reference: `REF-${reference}`,
    message: `Remboursement de ${amount} FCFA effectué`,
  };
}
