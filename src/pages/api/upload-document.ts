import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Whitelist des types de documents autorisés
const ALLOWED_DOCUMENT_TYPES = [
  'contrats',
  'sante',
  'paie',
  'formation',
  'identite',
  'fiscalite',
  'autre',
] as const;

// Whitelist des ownerTypes autorisés (correspondant aux rôles de la plateforme)
const ALLOWED_OWNER_TYPES = ['employee', 'employer', 'delegate', 'expatriate'] as const;
type OwnerType = typeof ALLOWED_OWNER_TYPES[number];

function toOwnerType(value: unknown): OwnerType {
  if (typeof value === 'string' && ALLOWED_OWNER_TYPES.includes(value as OwnerType)) {
    return value as OwnerType;
  }
  return 'employee';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createClient({
      request,
      cookies,
    });

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non authentifié' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string;
    const expiryDate = formData.get('expiryDate') as string;

    // Dériver ownerType depuis le profil authentifié (côté serveur — non forgeable par le client)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_expatriate')
      .eq('id', authData.user.id)
      .single();

    let ownerType: OwnerType = 'employee';
    if (profile) {
      const role = profile.role as string;
      const isExpatriate = profile.is_expatriate as boolean;
      const derivedRole = isExpatriate && role === 'employee' ? 'expatriate' : role;
      ownerType = toOwnerType(derivedRole);
    }

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: 'Aucun fichier fourni' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!documentType || !ALLOWED_DOCUMENT_TYPES.includes(documentType as any)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Type de document invalide. Types autorisés : ' + ALLOWED_DOCUMENT_TYPES.join(', ')
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Type de fichier non autorisé. Formats acceptés : PDF, Images, Word, Excel' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Le fichier est trop volumineux. Maximum 10MB' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${ownerType}/${authData.user.id}/${documentType}/${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erreur lors de l\'upload: ' + uploadError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const metadata = {
      original_name: file.name,
      size: file.size,
      mime_type: file.type,
      description: description || null,
      expiry_date: expiryDate || null,
    };

    const { data: documentData, error: insertError } = await supabase
      .from('user_documents')
      .insert({
        owner_id: authData.user.id,
        owner_type: ownerType,
        document_type: documentType,
        file_path: fileName,
        bucket_name: 'user-documents',
        metadata: metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion base de données:', insertError);
      await supabase.storage.from('user-documents').remove([fileName]);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erreur lors de l\'enregistrement du document' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document uploadé avec succès',
        document: documentData
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Une erreur inattendue s\'est produite' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
