export type UserRole = 'employee' | 'expatriate' | 'employer' | 'delegate';

export type XalimaTemplate = {
  slug: string;
  label: string;
  icon: string;
  description: string;
  color: string;
};

export type AllowedDocumentType = 'contrats' | 'sante' | 'paie' | 'formation' | 'identite' | 'fiscalite' | 'autre';

export type RoleConfig = {
  label: string;
  basePath: string;
  setlouTokenLimit: number;
  xalimaTokenLimit: number;
  setlouInitialMessage: string;
  setlouDefaultQuestions: string[];
  setlouContext: string;
  xalimaTemplates: XalimaTemplate[];
  /**
   * ownerType is passed to DocumentUpload and included in FormData sent to the upload endpoint.
   * With the default /api/upload-document endpoint, ownerType from the client is IGNORED:
   * the server derives the actual role from the authenticated user's profile (profiles.role + is_expatriate).
   * ownerType in this config is therefore informational / for future endpoints that trust client metadata,
   * and should not be relied upon for server-side authorization with the default endpoint.
   */
  documentOwnerType: string;
  documentUploadEndpoint: string;
  documentDefaultType: AllowedDocumentType;
};

const EMPLOYEE_TEMPLATES: XalimaTemplate[] = [
  { slug: 'demande_conge', label: 'Demande de congé', icon: '🏖️', description: 'Congé annuel, maladie, maternité, événement familial', color: 'purple' },
  { slug: 'contestation_sanction', label: 'Contestation de sanction', icon: '⚖️', description: 'Avertissement, mise à pied, blâme injustifié', color: 'red' },
  { slug: 'reponse_demande_explication', label: "Réponse à demande d'explication", icon: '📝', description: "Répondre à une demande d'explication de l'employeur", color: 'blue' },
  { slug: 'reclamation_salaire', label: 'Réclamation de salaire', icon: '💰', description: 'Retard, erreur de calcul, heures supplémentaires', color: 'green' },
  { slug: 'demande_certificat_travail', label: 'Certificat de travail', icon: '📄', description: 'Certificat de travail, attestation de présence', color: 'gray' },
  { slug: 'lettre_demission', label: 'Lettre de démission', icon: '🚪', description: 'Démission avec préavis, démission immédiate', color: 'orange' },
  { slug: 'demande_mutation', label: 'Demande de mutation', icon: '🔄', description: "Changement de poste, d'agence ou de service", color: 'teal' },
  { slug: 'contestation_licenciement', label: 'Contestation de licenciement', icon: '🛡️', description: 'Licenciement abusif, sans cause réelle', color: 'red' },
  { slug: 'demande_avancement', label: "Demande d'avancement", icon: '📈', description: 'Promotion, reclassification, augmentation', color: 'indigo' },
  { slug: 'courrier_libre', label: 'Courrier libre', icon: '✏️', description: 'Rédaction libre avec assistance IA', color: 'gray' },
];

const EXPATRIATE_TEMPLATES: XalimaTemplate[] = [
  { slug: 'demande_conge', label: 'Demande de congé', icon: '🏖️', description: 'Congé annuel, retour au pays, événement familial', color: 'purple' },
  { slug: 'reponse_demande_explication', label: "Réponse à demande d'explication", icon: '📝', description: "Répondre à une demande d'explication de l'employeur", color: 'blue' },
  { slug: 'reclamation_salaire', label: 'Réclamation de salaire', icon: '💰', description: 'Retard, erreur de calcul, indemnités expatriation', color: 'green' },
  { slug: 'demande_renouvellement_permis', label: 'Renouvellement de permis de travail', icon: '🌍', description: 'Demande de renouvellement ou régularisation', color: 'teal' },
  { slug: 'contestation_licenciement', label: 'Contestation de licenciement', icon: '🛡️', description: 'Licenciement abusif, sans cause réelle et sérieuse', color: 'red' },
  { slug: 'lettre_demission', label: 'Lettre de démission', icon: '🚪', description: 'Démission avec préavis, retour dans le pays d\'origine', color: 'orange' },
  { slug: 'demande_attestation', label: 'Demande d\'attestation', icon: '📄', description: 'Attestation de travail, certificat pour ambassade', color: 'gray' },
  { slug: 'courrier_libre', label: 'Courrier libre', icon: '✏️', description: 'Rédaction libre avec assistance IA', color: 'gray' },
];

const EMPLOYER_TEMPLATES: XalimaTemplate[] = [
  { slug: 'convocation_entretien', label: "Convocation à entretien préalable", icon: '📋', description: 'Entretien préalable à sanction ou licenciement', color: 'red' },
  { slug: 'notification_sanction', label: 'Notification de sanction disciplinaire', icon: '⚖️', description: 'Avertissement, blâme, mise à pied', color: 'orange' },
  { slug: 'lettre_licenciement', label: 'Lettre de licenciement', icon: '📤', description: 'Licenciement pour faute ou motif économique', color: 'red' },
  { slug: 'note_interne', label: 'Note de service / Note interne', icon: '📢', description: 'Circulaire, directive, communication interne', color: 'blue' },
  { slug: 'avenant_contrat', label: "Avenant au contrat de travail", icon: '📝', description: 'Modification de poste, salaire, conditions', color: 'indigo' },
  { slug: 'demande_explication', label: "Demande d'explication", icon: '❓', description: "Demander des explications à un employé", color: 'purple' },
  { slug: 'lettre_fin_periode_essai', label: "Rupture de période d'essai", icon: '🔚', description: "Notification de fin de période d'essai", color: 'gray' },
  { slug: 'attestation_travail', label: 'Attestation de travail', icon: '✅', description: "Délivrance d'une attestation ou certificat de travail", color: 'green' },
  { slug: 'courrier_libre', label: 'Courrier libre', icon: '✏️', description: 'Rédaction libre avec assistance IA', color: 'gray' },
];

const DELEGATE_TEMPLATES: XalimaTemplate[] = [
  { slug: 'pv_reunion', label: 'Procès-verbal de réunion', icon: '📋', description: 'PV réunion CE, délégués du personnel, CHSCT', color: 'blue' },
  { slug: 'reclamation_collective', label: 'Réclamation collective', icon: '✊', description: 'Réclamation au nom des travailleurs représentés', color: 'red' },
  { slug: 'demande_negociation', label: 'Demande d\'ouverture de négociation', icon: '🤝', description: 'Demander une négociation collective sur salaires, conditions', color: 'green' },
  { slug: 'accord_entreprise', label: "Projet d'accord d'entreprise", icon: '📜', description: "Rédiger un accord d'établissement ou d'entreprise", color: 'indigo' },
  { slug: 'alerte_sociale', label: 'Alerte sociale / Droit d\'alerte', icon: '⚠️', description: 'Exercer le droit d\'alerte en cas de danger ou irrégularité', color: 'orange' },
  { slug: 'lettre_droit_syndical', label: 'Courrier syndical / Exercice de mandat', icon: '🏛️', description: 'Correspondance dans le cadre du mandat de représentation', color: 'purple' },
  { slug: 'demande_information', label: "Demande d'information à l'employeur", icon: '❓', description: "Demander des documents ou informations dus aux représentants", color: 'teal' },
  { slug: 'courrier_libre', label: 'Courrier libre', icon: '✏️', description: 'Rédaction libre avec assistance IA', color: 'gray' },
];

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  employee: {
    label: 'Employé',
    basePath: '/espace-employes',
    setlouTokenLimit: 50000,
    xalimaTokenLimit: 50000,
    setlouInitialMessage: 'Bonjour ! Je suis SETLOU, votre conseiller IA en droit du travail sénégalais. Posez-moi vos questions sur vos droits, les procédures RH ou toute situation juridique liée à votre emploi.',
    setlouDefaultQuestions: [
      'Quels sont mes droits en cas de licenciement ?',
      'Comment contester une sanction disciplinaire ?',
      'Que faire en cas de non-paiement de salaire ?',
      'Quelles sont les conditions légales du préavis ?',
    ],
    setlouContext: 'Tu assistes un salarié du secteur privé ou parapublic sénégalais. Tes réponses doivent être fondées sur le Code du Travail sénégalais (Loi n° 97-17) et les conventions collectives applicables.',
    xalimaTemplates: EMPLOYEE_TEMPLATES,
    documentOwnerType: 'employee',
    documentUploadEndpoint: '/api/upload-document',
    documentDefaultType: 'contrats',
  },

  expatriate: {
    label: 'Expatrié',
    basePath: '/espace-expatries',
    setlouTokenLimit: 1000000,
    xalimaTokenLimit: 1000000,
    setlouInitialMessage: 'Bonjour ! Je suis SETLOU, votre conseiller IA spécialisé dans le droit du travail sénégalais pour les travailleurs expatriés. Comment puis-je vous aider ?',
    setlouDefaultQuestions: [
      'Quels sont mes droits en tant qu\'expatrié au Sénégal ?',
      'Comment régulariser mon permis de travail ?',
      'Quelles sont mes cotisations sociales obligatoires ?',
      'Puis-je contester un licenciement en tant qu\'expatrié ?',
    ],
    setlouContext: 'Tu assistes un travailleur expatrié employé au Sénégal. Tiens compte du contexte d\'expatriation, des permis de travail, des conventions bilatérales et du Code du Travail sénégalais. Rappelle toujours de consulter un avocat pour les situations complexes.',
    xalimaTemplates: EXPATRIATE_TEMPLATES,
    documentOwnerType: 'expatriate',
    documentUploadEndpoint: '/api/upload-document',
    documentDefaultType: 'identite',
  },

  employer: {
    label: 'Employeur',
    basePath: '/espace-employeurs',
    setlouTokenLimit: 3000000,
    xalimaTokenLimit: 3000000,
    setlouInitialMessage: 'Bonjour ! Je suis SETLOU, votre conseiller RH digital. Je vous aide à naviguer le droit du travail sénégalais, à sécuriser vos procédures et à gérer vos obligations employeur. Comment puis-je vous aider ?',
    setlouDefaultQuestions: [
      'Quelles sont mes obligations en matière de déclaration sociale ?',
      'Comment procéder à un licenciement dans les règles ?',
      'Quels sont les délais légaux de préavis selon les catégories ?',
      'Comment rédiger un règlement intérieur conforme ?',
    ],
    setlouContext: 'Tu assistes un employeur ou responsable RH d\'entreprise privée ou parapublique sénégalaise. Tes réponses doivent aider à sécuriser les procédures RH, respecter le Code du Travail sénégalais et les conventions collectives. Tu peux aborder les obligations patronales, les procédures disciplinaires, les licenciements et la gestion des risques sociaux.',
    xalimaTemplates: EMPLOYER_TEMPLATES,
    documentOwnerType: 'employer',
    documentUploadEndpoint: '/api/upload-document',
    documentDefaultType: 'contrats',
  },

  delegate: {
    label: 'Délégué du personnel',
    basePath: '/espace-delegues',
    setlouTokenLimit: 5000000,
    xalimaTokenLimit: 3000000,
    setlouInitialMessage: 'Bonjour ! Je suis SETLOU, votre conseiller IA spécialisé en droit social et dialogue social. Je vous aide dans l\'exercice de votre mandat de représentation du personnel. Comment puis-je vous aider ?',
    setlouDefaultQuestions: [
      'Quelles sont les prérogatives du délégué du personnel ?',
      'Comment préparer une négociation collective ?',
      'Quelles informations l\'employeur doit-il me communiquer ?',
      'Comment exercer le droit d\'alerte économique ou social ?',
    ],
    setlouContext: 'Tu assistes un délégué du personnel ou représentant syndical dans une entreprise privée ou parapublique sénégalaise. Tes réponses doivent porter sur le droit de la représentation collective, les prérogatives des délégués, la négociation sociale, les conflits collectifs et le dialogue social au Sénégal.',
    xalimaTemplates: DELEGATE_TEMPLATES,
    documentOwnerType: 'delegate',
    documentUploadEndpoint: '/api/upload-document',
    documentDefaultType: 'autre',
  },
};

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role] ?? ROLE_CONFIGS.employee;
}
