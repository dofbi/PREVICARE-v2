
import { createClient } from '../../lib/supabase';

export async function updateProfile(input: any, context: any): Promise<{ success: boolean; message?: string }> {
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

    const { first_name, last_name, email, phone, address, country, organization, cni_number, passport_number } = input;

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        email,
        phone,
        address,
        country,
        organization,
        cni_number,
        passport_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du profil", updateError);
      return {
        success: false,
        message: updateError.message,
      };
    }

    return {
      success: true,
      message: "Profil mis à jour avec succès",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour du profil", err);
    return {
      success: false,
      message: "Erreur inattendue"
    };
  }
}
