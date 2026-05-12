
import { createClient } from '../../lib/supabase';

const ALLOWED_MANDATE_TYPES = [
  'Délégué titulaire',
  'Délégué suppléant',
  'Délégué syndical',
  'Représentant du personnel',
  'Membre du comité d\'entreprise',
];

function validateMandateType(mandateType: string): { valid: boolean; message?: string } {
  if (!mandateType || mandateType.trim() === '') {
    return { valid: false, message: "Le type de mandat ne peut pas être vide." };
  }
  if (mandateType.trim() === 'Autre') {
    return { valid: false, message: "Veuillez préciser le type de mandat dans le champ texte." };
  }
  if (!ALLOWED_MANDATE_TYPES.includes(mandateType.trim())) {
    if (mandateType.trim().length < 2) {
      return { valid: false, message: "Le type de mandat personnalisé doit comporter au moins 2 caractères." };
    }
  }
  return { valid: true };
}

export async function updateDelegateDetails(input: any, context: any): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient({
      request: context.request,
      cookies: context.cookies,
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return {
        success: false,
        message: "Utilisateur non authentifié",
      };
    }

    if (input.mandate_type !== undefined) {
      const mandateValidation = validateMandateType(input.mandate_type);
      if (!mandateValidation.valid) {
        return {
          success: false,
          message: mandateValidation.message,
        };
      }
    }

    const updateData: any = {};

    const integerFields = ['represented_employee_count', 'active_claims_count'];
    Object.keys(input).forEach(key => {
      if (input[key] !== undefined && input[key] !== '') {
        if (integerFields.includes(key)) {
          const parsed = parseInt(input[key], 10);
          if (!isNaN(parsed)) {
            updateData[key] = parsed;
          }
        } else if (key === 'mandate_type') {
          updateData[key] = (input[key] as string).trim();
        } else {
          updateData[key] = input[key];
        }
      }
    });

    const { data: existingRecord } = await supabase
      .from('delegate_details')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    let error;
    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('delegate_details')
        .update(updateData)
        .eq('id', authData.user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('delegate_details')
        .insert({
          id: authData.user.id,
          ...updateData,
        });
      error = insertError;
    }

    if (error) {
      console.error("Erreur lors de la mise à jour des détails délégué", error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Détails délégué mis à jour avec succès",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour des détails délégué", err);
    return {
      success: false,
      message: "Erreur inattendue",
    };
  }
}
