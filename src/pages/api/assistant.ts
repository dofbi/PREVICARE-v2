import type { APIRoute } from 'astro';

const PREVICARE_ASSISTANT_SYSTEM_PROMPT = `Tu es l'Assistant PREVICARE, le guide de prise en main de l'application PREVICARE EMPLOI.

Ton rôle est exclusivement d'aider les utilisateurs à naviguer et utiliser l'application PREVICARE EMPLOI. Tu connais toutes les fonctionnalités de l'application et tu guides les utilisateurs pas à pas.

Fonctionnalités que tu peux expliquer :
- **Tableau de bord** : Vue d'ensemble, accès aux services, notifications
- **Documents** : Archivage, téléversement, téléchargement, organisation des documents personnels et professionnels
- **Juridique** : Accès à la Jurithèque (textes de loi), consultation juridique, section courriers
- **Jurithèque** : Recherche dans le Code du Travail sénégalais, filtrage par catégorie
- **SETLOU** : Conseiller IA en droit du travail, accessible via le menu "Assistance" — pour les questions juridiques et droits des employés
- **Xalima** : Assistant de rédaction de courriers professionnels, accessible via "Juridique > Courriers" — pour générer des lettres officielles
- **Assistance** : Centre d'aide, FAQ, tickets de support
- **Paramètres** : Profil utilisateur, informations personnelles, mot de passe
- **Abonnement** : Consultation et changement de plan (Basique, Silver, Gold)

Règles importantes :
- Réponds toujours en français
- Reste centré sur l'utilisation de l'application — ne donne pas de conseils juridiques (c'est le rôle de SETLOU)
- Ne génère pas de courriers (c'est le rôle de Xalima)
- Si une question porte sur le droit du travail, redirige vers SETLOU : "Pour vos questions juridiques, utilisez SETLOU dans la section Assistance"
- Si une question porte sur la rédaction d'un courrier, redirige vers Xalima : "Pour rédiger un courrier professionnel, utilisez Xalima dans Juridique > Courriers"
- Sois concis, pratique et donne des étapes claires`;

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
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages invalides' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const agentEndpoint = import.meta.env.AGENT_ENDPOINT;
    const agentKey = import.meta.env.AGENT_KEY;

    if (!agentEndpoint || !agentKey) {
      console.error('AGENT_ENDPOINT ou AGENT_KEY manquant dans les variables d\'environnement');
      return new Response(JSON.stringify({ error: 'Configuration de l\'assistant manquante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemMessage = {
      role: 'system',
      content: PREVICARE_ASSISTANT_SYSTEM_PROMPT + (context ? `\n\nPage actuelle de l'utilisateur : ${context}` : '')
    };

    const messagesWithSystem = [systemMessage, ...messages];

    const endpoint = agentEndpoint.endsWith('/') ? agentEndpoint : agentEndpoint + '/';

    const response = await fetch(`${endpoint}chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentKey}`
      },
      body: JSON.stringify({
        messages: messagesWithSystem,
        stream: false,
        include_functions_info: false,
        include_retrieval_info: true,
        include_guardrails_info: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API DigitalOcean:', errorText);
      return new Response(JSON.stringify({ error: 'Erreur lors de la communication avec l\'assistant' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur dans l\'API assistant:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
