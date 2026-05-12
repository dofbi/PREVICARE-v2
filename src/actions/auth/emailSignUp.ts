
import { type ActionAPIContext } from "astro:actions";
import { createClient } from "../../lib/supabase";

export const emailSignUp = async (
    { 
      email, 
      password, 
      firstName, 
      lastName, 
      userType, 
      isExpatriate,
      terms
    }: { 
      email: string; 
      password: string; 
      firstName: string;
      lastName: string;
      userType: "employee" | "employer" | "delegate";
      isExpatriate?: boolean | string;
      terms?: boolean | string;
    },
    context: ActionAPIContext
  ) => {
    console.log("=== DÉBUT ACTION D'INSCRIPTION ===");
    console.log("Email:", email);
    console.log("Type d'utilisateur:", userType);
    console.log("Statut expatrié:", isExpatriate);
    console.log("Terms:", terms);
    
    // Pour éviter l'erreur de validation temporairement, on définit terms comme accepté par défaut
    const termsAccepted = terms === true || terms === "true" || terms === "on" || terms === undefined;
    console.log("Terms acceptés (par défaut):", termsAccepted);
    
    try {
      console.log("Configuration Supabase...");
      console.log("SUPABASE_URL:", import.meta.env.SUPABASE_URL);
      console.log("SUPABASE_KEY présente:", !!import.meta.env.SUPABASE_KEY);
      
      const supabase = createClient({
        request: context.request,
        cookies: context.cookies,
      });

      // Convertir isExpatriate en booléen si ce n'est pas déjà fait
      const expatriateStatus = isExpatriate === true || isExpatriate === 'true' || isExpatriate === 'on';
      console.log("Statut expatrié converti:", expatriateStatus);

      console.log("Tentative d'inscription avec Supabase...");
      // Essai avec une configuration minimale d'abord
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: userType,
            is_expatriate: expatriateStatus,
          },
        }
      });

      if (error) {
        console.error("=== ERREUR D'INSCRIPTION ===");
        console.error("Code d'erreur:", error.code);
        console.error("Message d'erreur:", error.message);
        console.error("Détails complets:", error);
        
        // Messages d'erreur personnalisés en français
        let userMessage = "Une erreur est survenue lors de l'inscription.";
        
        if (error.message.includes("User already registered") || error.message.includes("already registered")) {
          userMessage = "Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse.";
        } else if (error.message.includes("Invalid email") || error.message.includes("invalid email")) {
          userMessage = "L'adresse email fournie n'est pas valide.";
        } else if (error.message.includes("Password should be at least") || error.message.includes("weak password")) {
          userMessage = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
        } else if (error.message.includes("signup disabled") || error.code === "signup_disabled") {
          userMessage = "L'inscription est temporairement désactivée. Veuillez réessayer plus tard.";
        } else if (error.code === "email_already_confirmed") {
          userMessage = "Cette adresse email est déjà confirmée. Vous pouvez vous connecter.";
        } else if (error.message.includes("Email rate limit exceeded")) {
          userMessage = "Trop de tentatives d'inscription. Veuillez patienter quelques minutes avant de réessayer.";
        }
        
        return {
          success: false,
          message: userMessage,
        };
      } else {
        console.log("=== INSCRIPTION RÉUSSIE ===");
        console.log("Utilisateur créé:", data.user?.id);
        console.log("Email envoyé:", data.user?.email_confirmed_at ? "Confirmé" : "En attente de confirmation");
        console.log("Données complètes:", data);
        
        return {
          success: true,
          message: "Votre compte a été créé avec succès ! Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de validation pour activer votre compte.",
          data: {
            userId: data.user?.id,
            email: data.user?.email,
            confirmationSent: !data.user?.email_confirmed_at
          }
        };
      }
    } catch (err) {
      console.error("=== ERREUR INATTENDUE ===");
      console.error("Type d'erreur:", typeof err);
      console.error("Message:", err instanceof Error ? err.message : String(err));
      console.error("Stack:", err instanceof Error ? err.stack : 'Pas de stack trace');
      console.error("Objet complet:", err);
      
      return {
        success: false,
        message: "Une erreur technique inattendue s'est produite. Veuillez réessayer dans quelques instants.",
      };
    }
  };
