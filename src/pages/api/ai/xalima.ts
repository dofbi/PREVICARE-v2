import type { APIRoute } from 'astro';

const XALIMA_SYSTEM_PROMPT = `Tu es Xalima, l'assistant IA de rédaction de courriers professionnels de PREVICARE EMPLOI.

Ton rôle est de générer des courriers professionnels complets, structurés et juridiquement conformes au droit du travail sénégalais.

Tu es expert en :
- Rédaction de courriers professionnels en contexte sénégalais
- Code du Travail sénégalais (Loi n° 97-17)
- Normes épistolaires francophones et sénégalaises
- Formulations juridiques adaptées aux situations de travail

Types de courriers que tu génères :
- Demandes de congé (annuel, maladie, maternité, événement familial)
- Contestations de sanction (avertissement, blâme, mise à pied)
- Réponses à des demandes d'explication
- Réclamations de salaire (retard, erreur, heures supplémentaires)
- Demandes de certificat de travail ou d'attestation
- Lettres de démission
- Demandes de mutation ou de transfert
- Contestations de licenciement
- Demandes d'avancement ou de promotion
- Courriers libres professionnels

Structure de chaque courrier généré :
1. En-tête : Lieu, date, expéditeur, destinataire, objet
2. Corps : Introduction, développement structuré, conclusion
3. Formule de politesse adaptée au ton choisi
4. Signature

Règles :
- Génère TOUJOURS un courrier complet et prêt à envoyer
- Adapte le ton selon la demande (formel, ferme, conciliant, respectueux)
- Utilise les informations fournies dans le formulaire pour personnaliser le courrier
- Cite les articles de loi pertinents quand c'est approprié
- Réponds en français
- Format le courrier avec une mise en page claire et professionnelle`;

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { courrierType, formData, tone } = body;

    if (!courrierType || !formData) {
      return new Response(JSON.stringify({ error: 'Type de courrier et données du formulaire requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const agentEndpoint = import.meta.env.XALIMA_AGENT_ENDPOINT || import.meta.env.AGENT_ENDPOINT;
    const agentKey = import.meta.env.XALIMA_AGENT_KEY || import.meta.env.AGENT_KEY;

    if (!agentEndpoint || !agentKey) {
      console.error('XALIMA_AGENT_ENDPOINT ou XALIMA_AGENT_KEY manquant');
      return new Response(JSON.stringify({ error: 'Configuration de Xalima manquante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userPrompt = buildUserPrompt(courrierType, formData, tone);

    const messages = [
      { role: 'system', content: XALIMA_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ];

    const endpoint = agentEndpoint.endsWith('/') ? agentEndpoint : agentEndpoint + '/';

    const response = await fetch(`${endpoint}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentKey}`
      },
      body: JSON.stringify({
        messages,
        stream: false,
        include_functions_info: false,
        include_retrieval_info: false,
        include_guardrails_info: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API Xalima:', errorText);
      return new Response(JSON.stringify({ error: 'Erreur lors de la génération du courrier' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ courrier: generatedText, raw: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur dans l\'API Xalima:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function buildUserPrompt(courrierType: string, formData: Record<string, string>, tone: string): string {
  const toneLabel = {
    formel: 'formel et professionnel',
    ferme: 'ferme et assertif',
    conciliant: 'conciliant et diplomate',
    respectueux: 'respectueux et poli'
  }[tone] || 'formel et professionnel';

  const baseInfo = `
Expéditeur : ${formData.employee_name || 'Non précisé'}
Poste : ${formData.employee_position || 'Non précisé'}
Entreprise : ${formData.company_name || 'Non précisé'}
Destinataire : ${formData.recipient || 'Non précisé'}${formData.recipient_title ? ` (${formData.recipient_title})` : ''}
Ton souhaité : ${toneLabel}
Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
`;

  const typePrompts: Record<string, string> = {
    demande_conge: `
Génère une demande de congé avec les informations suivantes :
${baseInfo}
Type de congé : ${formData.leave_type || 'Congé annuel'}
Date de début : ${formData.start_date || 'Non précisée'}
Date de fin : ${formData.end_date || 'Non précisée'}
Motif : ${formData.reason || 'Non précisé'}
${formData.replacement_info ? `Continuité de service : ${formData.replacement_info}` : ''}
`,
    contestation_sanction: `
Génère une lettre de contestation de sanction disciplinaire avec les informations suivantes :
${baseInfo}
Type de sanction : ${formData.sanction_type || 'Non précisé'}
Date de la sanction : ${formData.sanction_date || 'Non précisée'}
${formData.sanction_reference ? `Référence : ${formData.sanction_reference}` : ''}
Faits reprochés : ${formData.facts_description || 'Non précisés'}
Motifs de contestation : ${formData.contestation_grounds || 'Non précisés'}
${formData.supporting_elements ? `Éléments à l'appui : ${formData.supporting_elements}` : ''}
`,
    reponse_demande_explication: `
Génère une réponse à une demande d'explication avec les informations suivantes :
${baseInfo}
Date de la demande reçue : ${formData.explanation_request_date || 'Non précisée'}
${formData.explanation_request_reference ? `Référence : ${formData.explanation_request_reference}` : ''}
Faits mentionnés : ${formData.alleged_facts || 'Non précisés'}
Explication de l'employé : ${formData.your_explanation || 'Non précisée'}
${formData.mitigating_circumstances ? `Circonstances atténuantes : ${formData.mitigating_circumstances}` : ''}
`,
    reclamation_salaire: `
Génère une lettre de réclamation salariale avec les informations suivantes :
${baseInfo}
Type de réclamation : ${formData.claim_type || 'Non précisé'}
${formData.amount_claimed ? `Montant réclamé : ${formData.amount_claimed} FCFA` : ''}
Période concernée : ${formData.period_concerned || 'Non précisée'}
Description de la situation : ${formData.situation_description || 'Non précisée'}
${formData.previous_steps ? `Démarches antérieures : ${formData.previous_steps}` : ''}
`,
    demande_certificat_travail: `
Génère une demande de certificat/attestation de travail avec les informations suivantes :
${baseInfo}
Type de document demandé : ${formData.document_type || 'Certificat de travail'}
${formData.purpose ? `Motif de la demande : ${formData.purpose}` : ''}
${formData.employment_start_date ? `Date de début de contrat : ${formData.employment_start_date}` : ''}
${formData.employment_end_date ? `Date de fin de contrat : ${formData.employment_end_date}` : ''}
`,
    lettre_demission: `
Génère une lettre de démission avec les informations suivantes :
${baseInfo}
Type de démission : ${formData.resignation_type || 'Démission avec préavis'}
${formData.notice_period ? `Durée du préavis : ${formData.notice_period}` : ''}
${formData.last_day ? `Dernier jour souhaité : ${formData.last_day}` : ''}
${formData.reason ? `Motif (facultatif) : ${formData.reason}` : ''}
${formData.gratitude_note === 'true' ? 'Inclure un paragraphe de remerciements.' : ''}
`,
    demande_mutation: `
Génère une demande de mutation/transfert avec les informations suivantes :
${baseInfo}
Service/Département actuel : ${formData.current_department || 'Non précisé'}
Service/Département souhaité : ${formData.desired_department || 'Non précisé'}
${formData.desired_position ? `Poste souhaité : ${formData.desired_position}` : ''}
Motivations : ${formData.reason || 'Non précisées'}
${formData.availability_date ? `Date de disponibilité : ${formData.availability_date}` : ''}
`,
    contestation_licenciement: `
Génère une lettre de contestation de licenciement avec les informations suivantes :
${baseInfo}
Date du licenciement : ${formData.dismissal_date || 'Non précisée'}
Type de licenciement : ${formData.dismissal_type || 'Non précisé'}
${formData.dismissal_reference ? `Référence : ${formData.dismissal_reference}` : ''}
Motifs invoqués par l'employeur : ${formData.stated_reasons || 'Non précisés'}
Motifs de contestation : ${formData.contestation_grounds || 'Non précisés'}
${formData.procedural_issues ? `Vices de procédure : ${formData.procedural_issues}` : ''}
${formData.seniority_years ? `Ancienneté : ${formData.seniority_years} an(s)` : ''}
${formData.demands ? `Demandes : ${formData.demands}` : ''}
`,
    demande_avancement: `
Génère une demande d'avancement/promotion avec les informations suivantes :
${baseInfo}
Type d'avancement : ${formData.advancement_type || 'Promotion'}
${formData.seniority_years ? `Ancienneté dans le poste : ${formData.seniority_years} an(s)` : ''}
Réalisations : ${formData.achievements || 'Non précisées'}
Justification : ${formData.justification || 'Non précisée'}
${formData.desired_position_or_grade ? `Poste/Grade souhaité : ${formData.desired_position_or_grade}` : ''}
`,
    courrier_libre: `
Génère un courrier professionnel avec les informations suivantes :
${baseInfo}
Objet : ${formData.subject || 'Non précisé'}
Description du contenu souhaité : ${formData.description || 'Non précisée'}
${formData.key_points ? `Points clés à inclure : ${formData.key_points}` : ''}
${formData.legal_references ? `Références juridiques à mentionner : ${formData.legal_references}` : ''}
`
  };

  return typePrompts[courrierType] || `
Génère un courrier professionnel de type "${courrierType}" avec les informations suivantes :
${baseInfo}
Informations complémentaires : ${JSON.stringify(formData, null, 2)}
`;
}
