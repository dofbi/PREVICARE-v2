import { type ActionAPIContext } from "astro:actions";
import { createClient } from "../../lib/supabase";

export const emailSignIn = async (
  { email, password }: { email: string; password: string },
  context: ActionAPIContext
) => {
  console.log("Action de connexion");
  try {
    const supabase = createClient({
      request: context.request,
      cookies: context.cookies,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erreur de connexion", error);
      return {
        success: false,
        message: error.message === 'Invalid login credentials' 
          ? 'Email ou mot de passe incorrect. Veuillez vérifier vos informations.' 
          : error.message,
      };
    } else {
      console.log("Connexion réussie", data);

      // Récupérer le rôle de l'utilisateur depuis les métadonnées
      const userRole = data.user?.user_metadata?.role;

      // Déterminer la page de redirection selon le rôle
      let redirectUrl = '/'; // Par défaut

      if (userRole === 'employee') {
        redirectUrl = '/espace-employes';
      } else if (userRole === 'employer') {
        redirectUrl = '/espace-employeurs';
      } else if (userRole === 'delegate') {
        redirectUrl = '/espace-delegues';
      }

      // Retourner les données de succès avec l'URL de redirection
      return {
        success: true,
        redirectUrl: redirectUrl,
        user: data.user
      };
    }
  } catch (err: any) {
    console.error("Erreur de connexion", err);
    
    return {
      success: false,
      message: "Erreur inattendue lors de la connexion. Veuillez réessayer."
    };
  }
};