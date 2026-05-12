import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { emailSignUp } from './emailSignUp';
import { emailSignIn } from './emailSignIn';
import { createClient } from "../../lib/supabase";
import { requestPasswordResetHandler, updatePasswordHandler } from './resetPassword';

export const auth = {
    signIn: defineAction({
        accept: "form",
        input: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
        handler: async (input, context) => {
          return emailSignIn(input, context);
        },
      }),
    signUp: defineAction({
        accept: "form",
        input: z.object({
            firstName: z.string().min(1, 'Le prénom est requis'),
            lastName: z.string().min(1, 'Le nom est requis'),
            email: z.string().email('Email invalide'),
            userType: z.enum(["employee", "employer", "delegate"]),
            password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
            confirmPassword: z.string(),
            phone: z.string().optional(),
            company: z.string().optional(),
            isExpatriate: z.boolean().default(false),
            terms: z.union([z.boolean(), z.string()]).optional(),
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'Les mots de passe ne correspondent pas',
            path: ['confirmPassword'],
        }),
        handler: async (input, context) => {
            return emailSignUp(input, context);
        },
    }),
    signOut: defineAction({
        handler: async (_, context) => {
            const supabase = createClient({
            request: context.request,
            cookies: context.cookies,
            });
            const { error } = await supabase.auth.signOut();
            if (error) {
            console.error("Erreur de déconnexion", error);
            return {
                success: false,
                message: error.message,
            };
            }
            return {
            success: true,
            message: "Déconnexion réussie",
            };
        },
    }),
    requestPasswordReset: defineAction({
        accept: "form",
        input: z.object({
          email: z.string().email('Veuillez entrer un email valide'),
        }),
        handler: async (input, context) => {
          return requestPasswordResetHandler(input, context);
        },
      }),
    updatePassword: defineAction({
        accept: "form",
        input: z.object({
          password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
          confirmPassword: z.string(),
        }).refine((data) => data.password === data.confirmPassword, {
          message: 'Les mots de passe ne correspondent pas',
          path: ['confirmPassword'],
        }),
        handler: async (input, context) => {
          return updatePasswordHandler({ password: input.password }, context);
        },
      }),
};