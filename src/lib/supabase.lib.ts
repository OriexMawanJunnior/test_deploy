import { supabase } from "./supabaseClient";
import {v4 as uuidv4} from "uuid";

export type SupabaseUploadOptions = {
  fileName: string;
  mimeType: string
}

export const uploadMediaToSupabase = async (mediaData: Blob | File | Buffer, {fileName, mimeType}: SupabaseUploadOptions) => {
  const { data: uploadResp, error } = await supabase
    .storage
    .from('media')
    .upload(fileName, mediaData, {
      contentType: mimeType, // Adjust content type as necessary
      upsert: false // Set to true to overwrite if the file already exists
    });

  if (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }

  // Get the public URL of the uploaded image
  const { data } = await supabase
    .storage
    .from('media')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// used to download file buffer by url
export async function downloadFileBuffer(url: string){
  return (await fetch(url)).arrayBuffer();
}

// download video from external url and upload it to supabase then return supabase urls
export async function downloadAndSaveVideoUrls(urls: string[], opt: {model: string, text: string, }){
  const videoUrls: string[] = [];
  for (const url of urls as string[]) {
    const fileName = `${opt.model}-${opt.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.mp4`; // Generate a unique file name
    const arrayBuffer = await downloadFileBuffer(url); // This returns an ArrayBuffer
    const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
    const imageUrl = await uploadMediaToSupabase(buffer, { fileName, mimeType: "video/mp4" });
    videoUrls.push(imageUrl);
  }
  return videoUrls;
}