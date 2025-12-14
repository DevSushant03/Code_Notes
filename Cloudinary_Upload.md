//take imput form user as file with multiple attribute
<input
type="file"
multiple
onChange={handleFileChange}
/>

//Get all file and store in array or object
const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const mapped = files.map((f) => ({
      file: f,
      filename: f.name,
  }));
};

//create a FormData Instance to store files before send it to backend
const fd = new FormData();
mapped.map((f)=>{
fd.append("files",f.file)
})

//make sure to add required headers while calling api to send file 
 axios.post("/api/sendfile", fd , {
      headers: { "Content-Type": "multipart/form-data" },
    }),

-------------------Backend------------------------

//use multer to send files to server side
import multer from "multer";
const storage = multer.memoryStorage(); // store file in memory buffer
const upload = multer({ storage });
export default upload;

//add upload.array for multiple files and upload.single for single file 
router.post("/sendfile", verifyAuth, upload.array("files"), sendfile);

//get all file using req method 
eg: re.files.buffer or use array for multiple

let uploadedFiles = [];
if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, "tasks");
          uploadedFiles.push({
            url: result.secure_url,
            filename: result.original_filename,
          });
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
    }

    
//then upload to cloudinary 
export const uploadToCloudinary = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: `tasktribe/${folderName}` },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    upload.end(fileBuffer);
  });
};

    
