*To delete file from cloudinary , We need PUBLIC KEY*
PUBLIC KEY is last two end point of Cloudinary file URL 

STEP 1 :- //Select Clodinary file URL which you want to delete 
using this function you can extract PUBLIC KEY from  Url
export const getPublicIdFromUrl = (url) => {
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/upload/")[1];
  if (!parts) return null;
  const withoutVersion = parts.replace(/^v[0-9]+\//, "");
  const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
  return publicId;
};

STEP 2 :- //Extract resoure type from url
export const getResourceType = (url) => {
  const extension = url.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension))
    return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) return "video";
  return "raw"; // pdf, doc, txt, zip, etc.
};

STEP 3:- //Delete

export const deleteCloudinaryFile = async (url) => {
  try {
    const publicId = getPublicIdFromUrl(url);
    const resourceType = getResourceType(url);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log("Cloudinary delete response:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
};
