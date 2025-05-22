import FileUploadDialog from "../../components/custom/file-upload-dialog/file-upload-dialog";

export default function AddToExistingKnowledge() {
  return (
    <div className="p-4">
      <p className="font-semibold text-lg text-white my-4">
        Add New Document To Knowledge Base
      </p>
      <FileUploadDialog />
    </div>
  );
}
