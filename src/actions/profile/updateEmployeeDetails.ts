
import { createClient } from '../../lib/supabase';

export async function updateEmployeeDetails(input: any, context: any): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient({
      request: context.request,
      cookies: context.cookies,
    });

    // Vérifier l'utilisateur authentifié
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return {
        success: false,
        message: "Utilisateur non authentifié",
      };
    }

    const updateData: any = {};

    // Ajouter seulement les champs fournis
    Object.keys(input).forEach(key => {
      if (input[key] !== undefined && input[key] !== '') {
        if (key === 'is_expatriate') {
          updateData[key] = input[key] === 'true' || input[key] === true;
        } else if (key.includes('date') && input[key]) {
          updateData[key] = input[key];
        } else {
          updateData[key] = input[key];
        }
      }
    });

    // Vérifier si l'enregistrement existe
    const { data: existingRecord } = await supabase
      .from('employee_details')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    let error;
    if (existingRecord) {
      // Mettre à jour l'enregistrement existant
      const { error: updateError } = await supabase
        .from('employee_details')
        .update(updateData)
        .eq('id', authData.user.id);
      error = updateError;
    } else {
      // Créer un nouvel enregistrement
      const { error: insertError } = await supabase
        .from('employee_details')
        .insert({
          id: authData.user.id,
          ...updateData,
        });
      error = insertError;
    }

    if (error) {
      console.error("Erreur lors de la mise à jour des détails employé", error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Détails employé mis à jour avec succès",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour des détails employé", err);
    return {
      success: false,
      message: "Erreur inattendue"
    };
  }
}
