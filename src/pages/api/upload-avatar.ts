import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createClient({
      request,
      cookies,
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non authentifié' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: 'Aucun fichier fourni' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Type de fichier non autorisé. Utilisez JPG, PNG ou WEBP' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Le fichier est trop volumineux. Maximum 5MB' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: filePath,
        updated_at: new Date().toISOString() 
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Erreur mise à jour profil:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erreur lors de la mise à jour du profil' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Photo de profil mise à jour avec succès',
        avatarUrl: filePath
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
