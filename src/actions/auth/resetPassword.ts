
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createClient } from '../../lib/supabase';

// Fonction utilitaire pour la réinitialisation de mot de passe
export const requestPasswordResetHandler = async ({ email }: { email: string }, context: any) => {
  try {
    const supabase = createClient({
      request: context.request,
      cookies: context.cookies,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL || 'https://35094514-4d5f-4f4d-b25d-28118c43c89b-00-5x9jzhpab73c.worf.replit.dev'}/reset-password-confirm`,
    });

    if (error) {
      return {
        success: false,
        message: error.message === 'User not found' 
          ? 'Aucun compte trouvé avec cette adresse email'
          : 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      };
    }

    return {
      success: true,
      message: 'Un email de réinitialisation a été envoyé à votre adresse'
    };
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite'
    };
  }
};

// Action pour demander la réinitialisation (envoyer l'email)
export const requestPasswordReset = defineAction({
  accept: 'form',
  input: z.object({
    email: z.string().email('Veuillez entrer un email valide'),
  }),
  handler: requestPasswordResetHandler,
});

// Fonction utilitaire pour mettre à jour le mot de passe
export const updatePasswordHandler = async ({ password }: { password: string }, context: any) => {
  try {
    const supabase = createClient({
      request: context.request,
      cookies: context.cookies,
    });

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du mot de passe'
      };
    }

    return {
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite'
    };
  }
};

// Action pour changer le mot de passe (après avoir cliqué sur le lien)
export const updatePassword = defineAction({
  accept: 'form',
  input: z.object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  }),
  handler: async ({ password }, context) => {
    return updatePasswordHandler({ password }, context);
  },
});
