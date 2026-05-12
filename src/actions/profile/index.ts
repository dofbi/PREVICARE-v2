
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { updateProfile } from './updateProfile';
import { updateEmployeeDetails } from './updateEmployeeDetails';
import { updateEmployerDetails } from './updateEmployerDetails';
import { updateDelegateDetails } from './updateDelegateDetails';

export const profile = {
  updateProfile: defineAction({
    accept: "form",
    input: z.object({
      first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
      last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
      email: z.string().email("Email invalide"),
      phone: z.string().optional(),
      address: z.string().optional(),
      avatar_url: z.string().optional(),
      country: z.string().optional(),
      organization: z.string().optional(),
      cni_number: z.string().optional(),
      passport_number: z.string().optional(),
    }),
    handler: async (input, context) => {
      return updateProfile(input, context);
    },
  }),

  updateEmployeeDetails: defineAction({
    accept: "form",
    input: z.object({
      is_expatriate: z.boolean().optional(),
      medical_insurer_name: z.string().optional(),
      // ipres_number: z.string().optional(),
      sector: z.string().optional(),
      hire_date: z.string().optional(),
      current_position: z.string().optional(),
      previous_position: z.string().optional(),
      previous_start_date: z.string().optional(),
      previous_end_date: z.string().optional(),
      contract_type: z.string().optional(),
      employer_name: z.string().optional(),
      employer_ceo_contact: z.string().optional(),
      employer_hr_contact: z.string().optional(),
      delegate_coordinator_contact: z.string().optional(),
    }),
    handler: async (input, context) => {
      return updateEmployeeDetails(input, context);
    },
  }),

  updateEmployerDetails: defineAction({
    accept: "form",
    input: z.object({
      employee_count: z.string().optional(),
      ninea: z.string().optional(),
      sector: z.string().optional(),
      active_claims_count: z.string().optional(),
    }),
    handler: async (input, context) => {
      return updateEmployerDetails(input, context);
    },
  }),

  updateDelegateDetails: defineAction({
    accept: "form",
    input: z.object({
      represented_employee_count: z.string().optional(),
      mandate_type: z.string().optional(),
      organization_id: z.string().optional(),
      active_claims_count: z.string().optional(),
    }),
    handler: async (input, context) => {
      return updateDelegateDetails(input, context);
    },
  }),
};
