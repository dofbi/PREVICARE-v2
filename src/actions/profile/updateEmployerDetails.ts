
import { createClient } from '../../lib/supabase';

const ALLOWED_SECTORS = [
  'Agriculture et pêche',
  'Bâtiment et travaux publics (BTP)',
  'Commerce et distribution',
  'Éducation et formation',
  'Énergie et mines',
  'Finance et assurance',
  'Hôtellerie et tourisme',
  'Industrie manufacturière',
  'Informatique et télécommunications',
  'Santé et pharmacie',
  'Services aux entreprises',
  'Transport et logistique',
];

function validateSector(sector: string): { valid: boolean; message?: string } {
  if (!sector || sector.trim() === '') {
    return { valid: false, message: "Le secteur d'activité ne peut pas être vide." };
  }
  if (sector.trim() === 'Autre') {
    return { valid: false, message: "Veuillez préciser le secteur d'activité dans le champ texte." };
  }
  if (!ALLOWED_SECTORS.includes(sector.trim())) {
    if (sector.trim().length < 2) {
      return { valid: false, message: "Le secteur d'activité personnalisé doit comporter au moins 2 caractères." };
    }
  }
  return { valid: true };
}

export async function updateEmployerDetails(input: any, context: any): Promise<{ success: boolean; message?: string }> {
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

    if (input.sector !== undefined) {
      const sectorValidation = validateSector(input.sector);
      if (!sectorValidation.valid) {
        return {
          success: false,
          message: sectorValidation.message,
        };
      }
    }

    const updateData: any = {};

    const integerFields = ['employee_count', 'active_claims_count'];
    Object.keys(input).forEach(key => {
      if (input[key] !== undefined && input[key] !== '') {
        if (integerFields.includes(key)) {
          const parsed = parseInt(input[key], 10);
          if (!isNaN(parsed)) {
            updateData[key] = parsed;
          }
        } else if (key === 'sector') {
          updateData[key] = (input[key] as string).trim();
        } else {
          updateData[key] = input[key];
        }
      }
    });

    const { data: existingRecord } = await supabase
      .from('employer_details')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    let error;
    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('employer_details')
        .update(updateData)
        .eq('id', authData.user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('employer_details')
        .insert({
          id: authData.user.id,
          ...updateData,
        });
      error = insertError;
    }

    if (error) {
      console.error("Erreur lors de la mise à jour des détails employeur", error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Détails employeur mis à jour avec succès",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour des détails employeur", err);
    return {
      success: false,
      message: "Erreur inattendue",
    };
  }
}
